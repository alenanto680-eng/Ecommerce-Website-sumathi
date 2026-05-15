const axios = require('axios');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Encrypted Redis token cache
// ---------------------------------------------------------------------------
// Requires: ioredis  (npm i ioredis)
// Env vars:
//   SHIPROCKET_EMAIL            – Shiprocket login email
//   SHIPROCKET_PASSWORD         – Shiprocket login password
//   SHIPROCKET_TOKEN_SECRET     – 32-byte hex string used for AES-256-GCM
//                                 Generate once: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//   REDIS_URL                   – Redis connection string (default: redis://127.0.0.1:6379)
//   SHIPROCKET_PICKUP_LOCATION  – pickup location label (default: 'Home')
//   SHIPROCKET_PICKUP_PINCODE   – pickup pincode (default: '560092')
// ---------------------------------------------------------------------------

let _redisClient = null;

function getRedisClient() {
  if (_redisClient) return _redisClient;
  const Redis = require('ioredis');
  _redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });
  _redisClient.on('error', (err) => {
    // Log but don't crash — getShiprocketToken will fall back to live auth
    console.error('[shiprocket] Redis error:', err.message);
  });
  return _redisClient;
}

const CACHE_KEY = 'shiprocket:auth_token';
const TOKEN_TTL_SECONDS = 9 * 24 * 60 * 60; // 9 days (Shiprocket tokens last 10)

/**
 * Derives a 32-byte key from SHIPROCKET_TOKEN_SECRET.
 * Throws early if the secret is missing so misconfiguration is caught at startup.
 */
function getDerivedKey() {
  const secret = process.env.SHIPROCKET_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      'SHIPROCKET_TOKEN_SECRET is not set. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  // Use a fixed salt — the secret itself provides the entropy.
  return crypto.scryptSync(secret, 'shiprocket-token-cache', 32);
}

/** Encrypt plaintext → "iv:authTag:ciphertext" (all hex) */
function encrypt(plaintext) {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
}

/** Decrypt "iv:authTag:ciphertext" → plaintext. Returns null on any failure. */
function decrypt(stored) {
  try {
    const key = getDerivedKey();
    const [ivHex, authTagHex, encHex] = stored.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    // Tampered data or wrong key — treat as a cache miss
    return null;
  }
}

/** Read the cached token from Redis. Returns the token string or null. */
async function getCachedToken() {
  try {
    const redis = getRedisClient();
    const stored = await redis.get(CACHE_KEY);
    if (!stored) return null;
    return decrypt(stored); // null if decryption fails
  } catch {
    return null; // Redis unavailable — fall through to live auth
  }
}

/** Write an encrypted token to Redis with a TTL. */
async function setCachedToken(token) {
  try {
    const redis = getRedisClient();
    const encrypted = encrypt(token);
    await redis.set(CACHE_KEY, encrypted, 'EX', TOKEN_TTL_SECONDS);
  } catch (err) {
    // Non-fatal — the caller already has a live token; just log the miss.
    console.error('[shiprocket] Failed to cache token in Redis:', err.message);
  }
}

/** Invalidate the cached token (e.g. after a 401 from the API). */
async function clearCachedToken() {
  try {
    const redis = getRedisClient();
    await redis.del(CACHE_KEY);
  } catch {
    // Best-effort
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    return { success: false, error: 'SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD missing in environment' };
  }

  // 1. Try the encrypted Redis cache first
  const cached = await getCachedToken();
  if (cached) {
    return { success: true, token: cached };
  }

  // 2. Cache miss (or Redis down) — authenticate against the API
  try {
    const response = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/auth/login',
      { email, password }
    );

    const token = response.data?.token;
    if (!token) {
      return { success: false, error: 'Login response did not include a token' };
    }

    // Store encrypted in Redis; non-blocking (fire-and-forget is fine here)
    await setCachedToken(token);

    return { success: true, token };
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    return { success: false, error: `Shiprocket login failed: ${errMsg}` };
  }
}

// ---------------------------------------------------------------------------
// Helpers — retry once on 401 by clearing the cached token
// ---------------------------------------------------------------------------

/**
 * Wraps an API call. If the server returns 401, clears the cached token and
 * retries once with a freshly obtained token.
 */
async function withAuth(apiCall) {
  const auth = await getShiprocketToken();
  if (!auth.success) throw new Error(auth.error);

  try {
    return await apiCall(auth.token);
  } catch (error) {
    if (error.response?.status === 401) {
      await clearCachedToken();
      const retry = await getShiprocketToken();
      if (!retry.success) throw new Error(retry.error);
      return await apiCall(retry.token);
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

exports.createOrder = async (orderData) => {
  try {
    return await withAuth(async (token) => {
      const state = orderData.shippingAddress.state || 'Karnataka';

      const shiprocketOrderPayload = {
        order_id: orderData.displayId,
        order_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Home',
        billing_customer_name: orderData.shippingAddress.name || 'Guest',
        billing_last_name: '',
        billing_address:
          orderData.shippingAddress.street ||
          orderData.shippingAddress.address ||
          'Address',
        billing_city: orderData.shippingAddress.city || 'City',
        billing_pincode: String(orderData.shippingAddress.pincode || '560001'),
        billing_state: state,
        billing_country: 'India',
        billing_email:
          orderData.userEmail ||
          orderData.shippingAddress?.email ||
          'guest@sumathitrends.in',
        billing_phone: String(
          orderData.shippingAddress.phone ||
          orderData.shippingAddress.mobile ||
          '9999999999'
        ),
        shipping_is_billing: true,
        order_items: orderData.items.map((item) => ({
          name: item.name,
          sku: item.sku || item.productId || item._id?.toString() || 'SKU-001',
          units: item.qty || 1,
          selling_price: item.price,
        })),
        payment_method: 'Prepaid',
        sub_total: orderData.amount,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
      };

      const response = await axios.post(
        'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
        shiprocketOrderPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status_code === 1) {
        return {
          success: true,
          shiprocketOrderId: response.data.order_id,
          shiprocketShipmentId: response.data.shipment_id,
        };
      }

      const errorMsg = response.data.message || 'Validation error from Shiprocket';
      const detail = response.data.errors
        ? JSON.stringify(response.data.errors)
        : '';
      return {
        success: false,
        error: `${errorMsg}${detail ? ': ' + detail : ''}`,
      };
    });
  } catch (error) {
    const apiError = error.response?.data;
    let errorMessage = apiError?.message || error.message;
    if (apiError?.errors) {
      errorMessage += ': ' + JSON.stringify(apiError.errors);
    }
    return { success: false, error: errorMessage };
  }
};

exports.generateTrackingLink = (shipmentId) => {
  return `https://shiprocket.co/tracking/${shipmentId}`;
};

exports.getTrackingByOrderId = async (orderId) => {
  try {
    return await withAuth(async (token) => {
      const response = await axios.get(
        `https://apiv2.shiprocket.in/v1/external/courier/track?order_id=${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data[orderId]) {
        return {
          success: true,
          data: response.data[orderId].tracking_data,
          isOrderLevel: true,
        };
      }

      return { success: false, error: 'No tracking data found for this Order ID' };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

exports.checkServiceability = async (deliveryPincode) => {
  try {
    return await withAuth(async (token) => {
      const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || '560092';

      const codUrl =
        `https://apiv2.shiprocket.in/v1/external/courier/serviceability/` +
        `?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=0.5&cod=1`;

      let res = await axios.get(codUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = res.data;
      let available = data.data?.available_courier_companies || [];

      if (available.length === 0) {
        const prepaidUrl =
          `https://apiv2.shiprocket.in/v1/external/courier/serviceability/` +
          `?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=0.5&cod=0`;
        res = await axios.get(prepaidUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        data = res.data;
        available = data.data?.available_courier_companies || [];
      }

      return {
        success: data.status === 200,
        serviceable: data.status === 200 && available.length > 0,
        data: data.data,
      };
    });
  } catch (error) {
    const apiError = error.response?.data;
    return {
      success: false,
      serviceable: false,
      message: apiError?.message || error.message,
    };
  }
};

exports.getTrackingDetails = async (shipmentId) => {
  try {
    return await withAuth(async (token) => {
      const response = await axios.get(
        `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, data: response.data.tracking_data };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};