const ClientUser = require('../models/ClientUser');
const Order = require('../models/Order');
const ProductReview = require('../models/ProductReview');

/* ── GET all clients (paginated + filtered) ── */
exports.getAllClients = async (req, res) => {
  try {
    const { loginType, search, dateFilter, page = 1, limit = 20 } = req.query;
    const query = {};

    if (loginType && loginType !== 'all') {
      query.$or = query.$or || [];
      query.$and = [
        {
          $or: [
            { loginTypes: { $in: [loginType] } },
            { loginTypes: loginType },
            { loginType: loginType },
          ]
        }
      ];
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } },
      ];
    }

    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'joined-today') query.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
      else if (dateFilter === 'joined-week') query.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
      else if (dateFilter === 'joined-month') query.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await ClientUser.countDocuments(query);
    const users = await ClientUser.find(query)
      .sort({ lastSeen: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Attach order counts for each user
    const usersWithOrders = await Promise.all(users.map(async (u) => {
      const orderCount = await Order.countDocuments({ 
        userId: { $in: u.uids }, 
        status: 'success' 
      });
      return { ...u, orderCount };
    }));

    res.json({ success: true, total, page: Number(page), users: usersWithOrders });
  } catch (err) {
    console.error('❌ getAllClients error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/* ── GET single client detail ── */
exports.getClientDetail = async (req, res) => {
  try {
    const user = await ClientUser.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: 'Client not found' });

    // Fetch full order history from Order collection
    const orders = await Order.find({ 
      userId: { $in: user.uids },
      status: { $in: ['success', 'pending'] }
    }).sort({ createdAt: -1 });

    // Fetch product reviews linked to this client's firebase UIDs
    const reviews = await ProductReview.find({
      uid: { $in: user.uids },
    }).sort({ createdAt: -1 }).lean();
    // Map Order model fields to what ClientManagement.jsx expects (status, amount, createdAt/placedAt, etc.)
    const formattedOrders = orders.map(o => ({
      orderId: o.orderId,
      status: o.status,
      total: o.amount,
      placedAt: o.createdAt,
      items: o.items
    }));

    res.json({ success: true, user: { ...user, orders: formattedOrders, reviews } });
  } catch (err) {
    console.error('❌ getClientDetail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/* ── GET dashboard stats ── */
exports.getStats = async (req, res) => {
  try {
    const total = await ClientUser.countDocuments();

    // Use $or to handle loginTypes stored as array ['google'] OR legacy string 'google'
    const googleQ = { $or: [{ loginTypes: { $in: ['google'] } }, { loginTypes: 'google' }, { loginType: 'google' }] };
    const phoneQ = { $or: [{ loginTypes: { $in: ['phone'] } }, { loginTypes: 'phone' }, { loginType: 'phone' }] };
    const google = await ClientUser.countDocuments(googleQ);
    const phone = await ClientUser.countDocuments(phoneQ);
    const linked = await ClientUser.countDocuments({
      $or: [
        { $expr: { $gte: [{ $size: { $ifNull: ['$loginTypes', []] } }, 2] } },
      ]
    });
    const withCart = await ClientUser.countDocuments({ 'cart.0': { $exists: true } });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const newToday = await ClientUser.countDocuments({ createdAt: { $gte: today } });

    console.log('📊 getStats — total clients:', total);
    res.json({ success: true, stats: { total, google, phone, linked, withCart, newToday } });
  } catch (err) {
    console.error('❌ getStats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   ONE-TIME MIGRATION — merge duplicates & assign customerIds
   POST /api/admin/clients/migrate
   Safe to call multiple times (idempotent).
───────────────────────────────────────────────────────────────── */
exports.migrateClients = async (req, res) => {
  try {
    const all = await ClientUser.find({});
    let merged = 0, assigned = 0, counter = await ClientUser.countDocuments();

    // ── 1. Assign customerId to anyone missing one ──
    for (const u of all) {
      let changed = false;

      if (!u.customerId) {
        u.customerId = `CUST-${String(counter).padStart(5, '0')}`;
        counter++;
        changed = true;
        assigned++;
      }

      // Ensure loginTypes matches uids length (backward compat)
      // If on old schema (uid: string instead of uids: array):
      if (u.uid && (!u.uids || u.uids.length === 0)) {
        u.uids = [u.uid];
        changed = true;
      }
      if (!u.loginTypes || u.loginTypes.length === 0) {
        // Infer from old loginType field
        const lt = u.loginType || (u.email ? 'google' : 'phone');
        u.loginTypes = [lt];
        changed = true;
      }

      if (changed) await u.save();
    }

    // ── 2. Find pairs with the same email or phone and merge ──
    const freshAll = await ClientUser.find({});

    // Index by email
    const byEmail = {};
    for (const u of freshAll) {
      if (u.email) {
        if (!byEmail[u.email]) byEmail[u.email] = [];
        byEmail[u.email].push(u);
      }
    }

    // Index by phone
    const byPhone = {};
    for (const u of freshAll) {
      if (u.phone) {
        if (!byPhone[u.phone]) byPhone[u.phone] = [];
        byPhone[u.phone].push(u);
      }
    }

    const mergedIds = new Set();

    const doMerge = async (group) => {
      if (group.length < 2) return;
      // Sort oldest first — keep oldest as primary
      group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const [primary, ...duplicates] = group;

      for (const dup of duplicates) {
        if (mergedIds.has(String(dup._id))) continue;
        mergedIds.add(String(dup._id));

        // Merge UIDs
        for (const uid of (dup.uids || [])) {
          if (!primary.uids.includes(uid)) primary.uids.push(uid);
        }
        // Merge loginTypes
        for (const lt of (dup.loginTypes || [])) {
          if (!primary.loginTypes.includes(lt)) primary.loginTypes.push(lt);
        }
        // Merge contact info
        if (!primary.email && dup.email) primary.email = dup.email;
        if (!primary.phone && dup.phone) primary.phone = dup.phone;
        if (!primary.photo && dup.photo) primary.photo = dup.photo;
        if (!primary.gender && dup.gender) primary.gender = dup.gender;
        // Merge addresses (avoid exact duplicates)
        for (const addr of (dup.addresses || [])) {
          const exists = primary.addresses.some(a => a.pincode === addr.pincode && a.address === addr.address);
          if (!exists) primary.addresses.push(addr);
        }
        // Merge wishlist
        for (const item of (dup.wishlist || [])) {
          if (!primary.wishlist.some(w => w.productId === item.productId)) primary.wishlist.push(item);
        }
        // Merge orders
        for (const o of (dup.orders || [])) {
          if (!primary.orders.some(x => x.orderId === o.orderId)) primary.orders.push(o);
        }

        await ClientUser.deleteOne({ _id: dup._id });
        merged++;
        console.log(`🗑️ Merged duplicate ${dup.customerId} → ${primary.customerId}`);
      }
      await primary.save();
    };

    for (const group of Object.values(byEmail)) await doMerge(group);
    for (const group of Object.values(byPhone)) {
      // Re-fetch group to get latest state after email merges
      const refreshed = await Promise.all(group.map(u => ClientUser.findById(u._id)));
      await doMerge(refreshed.filter(Boolean));
    }

    res.json({ success: true, assigned, merged, message: `Migration complete. Assigned ${assigned} customerIds, merged ${merged} duplicate accounts.` });
  } catch (err) {
    console.error('❌ migrateClients error:', err);
    res.status(500).json({ error: err.message });
  }
};