const crypto = require('crypto');
const razorpay = require('../conf/razorpay');
const Order = require('../models/Order');
const Product = require('../models/Product');
const shiprocketService = require('../services/shiprocket');

const FREE_SHIPPING_THRESHOLD = 0; // Everything is Free Shipping now!
const GIFT_WRAP_COST = 50;

const calculateOrderTotals = async (items, giftWrapping) => {
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) throw new Error(`Product not found: ${item.name || item.productId}`);

    if (product.stock < (item.qty || 1)) {
      throw new Error(`Sorry, only ${product.stock} units of "${product.name}" are available.`);
    }

    const itemPrice = product.price;
    const itemQty = Number(item.qty) || 1;
    subtotal += itemPrice * itemQty;

    validatedItems.push({
      ...item,
      price: itemPrice
    });
  }

  const shipping = 0; // Forced to zero per user request
  const giftCost = giftWrapping ? GIFT_WRAP_COST : 0;
  const total = subtotal + shipping + giftCost;

  return { subtotal, shipping, giftCost, total, validatedItems };
};

exports.createOrder = async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ success: false, error: 'Razorpay not configured' });
  }
  try {
    const {
      amount: clientAmount,
      userId,
      userName,
      userEmail,
      items,
      giftWrapping,
      shippingAddress,
      currency = 'INR',
      receipt = `rcpt_${Date.now()}`
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Items are required' });
    }

    let totals;
    try {
      totals = await calculateOrderTotals(items, giftWrapping);
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    const { total: finalCalculatedAmount, validatedItems } = totals;

    // Use client-provided amount if it exists, otherwise fallback to calculated amount
    // This allows manual manipulation of the price from the frontend
    const finalAmountToCharge = clientAmount !== undefined ? clientAmount : finalCalculatedAmount;

    const options = {
      amount: Math.round(finalAmountToCharge * 100), // convert to paisa
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let displayId = 'ST-';
    for (let i = 0; i < 6; i++) displayId += chars.charAt(Math.floor(Math.random() * chars.length));

    let finalEmail = userEmail || shippingAddress?.email;
    if (!finalEmail && userId && userId !== 'guest') {
      const client = await ClientUser.findOne({ uids: userId }).lean();
      if (client?.email) finalEmail = client.email;
    }

    await Order.create({
      orderId: order.id,
      displayId,
      userId: userId || 'guest',
      userName: userName || shippingAddress?.name || shippingAddress?.fullName,
      userEmail: finalEmail,
      amount: finalAmountToCharge,
      currency,
      items: validatedItems,
      shippingAddress,
      giftWrapping: !!giftWrapping,
      status: 'pending'
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create Razorpay order',
      detail: error.message
    });
  }
};

exports.calculateSummary = async (req, res) => {
  try {
    const { items, giftWrapping } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Items are required' });
    }

    const totals = await calculateOrderTotals(items, giftWrapping);
    res.json({ success: true, ...totals });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ success: false, error: 'Razorpay not configured' });
  }
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSignature) {
      let method = 'Unknown';
      try {
        const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        method = paymentDetails.method;
      } catch (err) { }

      const updatedOrder = await Order.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          status: 'success',
          paymentId: razorpay_payment_id,
          paymentMethod: method
        },
        { new: true }
      );

      if (updatedOrder) {
        try {
          for (const item of updatedOrder.items) {
            if (item.productId && item.qty) {
              await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -Number(item.qty) }
              });
            }
          }
        } catch (stockError) { }

        const srResponse = await shiprocketService.createOrder(updatedOrder);
        if (srResponse.success) {
          updatedOrder.shiprocketOrderId = srResponse.shiprocketOrderId;
          updatedOrder.shiprocketShipmentId = srResponse.shiprocketShipmentId;
          updatedOrder.trackingLink = shiprocketService.generateTrackingLink(srResponse.shiprocketShipmentId);
        } else {
          updatedOrder.shiprocketError = JSON.stringify(srResponse.error);
        }
        await updatedOrder.save();
      }

      return res.json({ success: true, message: 'Payment verified successfully and order pushed to Shiprocket' });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
};

const ClientUser = require('../models/ClientUser');

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingAutoSync = orders.filter(o => o.status === 'success' && !o.shiprocketOrderId && o.createdAt > oneDayAgo);

    if (pendingAutoSync.length > 0) {
      for (const o of pendingAutoSync) {
        try {
          const srResponse = await shiprocketService.createOrder(o);
          if (srResponse.success) {
            const doc = await Order.findById(o._id);
            doc.shiprocketOrderId = srResponse.shiprocketOrderId;
            doc.shiprocketShipmentId = srResponse.shiprocketShipmentId;
            doc.trackingLink = shiprocketService.generateTrackingLink(srResponse.shiprocketShipmentId);
            await doc.save();
            const target = orders.find(orig => orig._id.toString() === o._id.toString());
            if (target) {
              target.shiprocketOrderId = srResponse.shiprocketOrderId;
              target.shiprocketShipmentId = srResponse.shiprocketShipmentId;
              target.trackingStatus = 'NEW';
            }
          }
        } catch (err) { }
      }
    }

    const joinedData = await Promise.all(orders.map(async (o) => {
      if (o.userId && o.userId !== 'guest') {
        const userDoc = await ClientUser.findOne({ uids: o.userId }).lean();
        if (userDoc) {
          o.user = {
            id: userDoc.customerId || 'N/A',
            name: userDoc.name || 'Unknown',
            email: userDoc.email || 'N/A'
          };
        }
      }
      return o;
    }));

    res.json({ success: true, count: joinedData.length, data: joinedData });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ success: false, error: 'User UID is required' });

    const orders = await Order.find({ userId: uid, status: 'success' }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch your orders' });
  }
};

exports.syncTrackingStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    let tracking = { success: false };

    if (order.shiprocketShipmentId) {
      tracking = await shiprocketService.getTrackingDetails(order.shiprocketShipmentId);
    }

    if (!tracking.success || !tracking.data) {
      tracking = await shiprocketService.getTrackingByOrderId(order.displayId);
    }

    if (tracking.success && tracking.data) {
      const td = tracking.data;

      order.trackingStatus = td.track_status || order.trackingStatus;
      order.trackingActivities = (td.shipment_track_activities || []).sort((a, b) => new Date(b.date) - new Date(a.date));

      // Auto-detect delivery from activities if not already marked
      if (order.trackingStatus?.toUpperCase() !== 'DELIVERED') {
        const hasDeliveredActivity = order.trackingActivities.some(a => {
          const s = a.status?.toLowerCase() || '';
          const act = a.activity?.toLowerCase() || '';
          return s.includes('delivered') || s.includes('delivery_update') || act.includes('delivered to consignee');
        });
        if (hasDeliveredActivity) {
          order.trackingStatus = 'DELIVERED';
        }
      }

      const results = {
        success: true,
        trackingStatus: order.trackingStatus,
        courier: td.courier_name || 'Logistic Partner',
        awb: td.awb_code || '',
        activities: order.trackingActivities
      };

      await order.save();
      return res.json(results);
    }

    res.json({ success: false, message: 'Tracking info not yet available from Shiprocket' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.manualSyncToShiprocket = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.shiprocketOrderId) return res.status(400).json({ success: false, error: 'Order already exists in Shiprocket' });

    const srResponse = await shiprocketService.createOrder(order);
    if (srResponse.success) {
      order.shiprocketOrderId = srResponse.shiprocketOrderId;
      order.shiprocketShipmentId = srResponse.shiprocketShipmentId;
      order.shiprocketError = null;
      order.trackingLink = shiprocketService.generateTrackingLink(srResponse.shiprocketShipmentId);
      await order.save();
      return res.json({ success: true, message: 'Successfully pushed to Shiprocket', srOrderId: srResponse.shiprocketOrderId });
    } else {
      order.shiprocketError = JSON.stringify(srResponse.error);
      await order.save();
      return res.status(400).json({ success: false, error: srResponse.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    let order;

    // 1. Try finding by MongoDB ID
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(orderId);
    }

    // 2. Try by Display ID (e.g. ST-XXXXX)
    if (!order) {
      order = await Order.findOne({ displayId: orderId });
    }

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch order details' });
  }
};