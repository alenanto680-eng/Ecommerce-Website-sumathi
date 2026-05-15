const cron = require('node-cron');
const Order = require('./models/Order');
const Product = require('./models/Product');
const ProductDetail = require('./models/ProductDetail');
const ProductReview = require('./models/ProductReview');
const ClientUser = require('./models/ClientUser');
const shiprocket = require('./services/shiprocket');

// ── Cleanup Old Users (Older than 60 days) ──
const cleanupOldUsers = async () => {
    try {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Find users older than 60 days
        const oldUsers = await ClientUser.find({ createdAt: { $lt: sixtyDaysAgo } });

        if (oldUsers.length === 0) {
            console.log('✅ [User Cleanup] No old users found.');
            return;
        }

        console.log(`🧹 [User Cleanup] Found ${oldUsers.length} users older than 60 days, deleting...`);

        for (const user of oldUsers) {
            // Delete all orders associated with this user's UIDs
            if (user.uids && user.uids.length > 0) {
                await Order.deleteMany({ userId: { $in: user.uids } });
            }
            // Delete the user profile itself
            await ClientUser.findByIdAndDelete(user._id);
            
            console.log(`🗑️ [User Cleanup] Deleted user: ${user.name || user.phone || 'Unknown'} (${user._id})`);
        }
        console.log('✨ [User Cleanup] Finished clearing old user data.');
    } catch (err) {
        console.error('❌ [User Cleanup] error:', err.message);
    }
};

// ── Cleanup Old Products (Older than 60 days) ──
const cleanupOldProducts = async () => {
    try {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Find products older than 60 days
        const oldProducts = await Product.find({ createdAt: { $lt: sixtyDaysAgo } });

        if (oldProducts.length === 0) {
            console.log('✅ [Cleanup] No old products found.');
            return;
        }

        console.log(`🧹 [Cleanup] Found ${oldProducts.length} products older than 60 days, deleting...`);

        for (const product of oldProducts) {
            const pId = product._id;
            // Delete product
            await Product.findByIdAndDelete(pId);
            // Delete details
            await ProductDetail.deleteOne({ product: pId });
            // Delete reviews
            await ProductReview.deleteMany({ productId: pId });
            
            console.log(`🗑️ [Cleanup] Deleted: ${product.name} (${pId})`);
        }
        console.log('✨ [Cleanup] Finished clearing old products.');
    } catch (err) {
        console.error('❌ [Cleanup] error:', err.message);
    }
};

// ── Run immediately on startup to catch any missed orders ──
const syncUnsyncedOrders = async () => {
    try {
        // Fix: catch null/empty fields too, not just $exists: false
        const unsyncedOrders = await Order.find({
            status: 'success',
            $or: [
                { shiprocketOrderId: { $exists: false } },
                { shiprocketOrderId: null },
                { shiprocketOrderId: '' }
            ]
        });

        if (unsyncedOrders.length === 0) {
            console.log('✅ No unsynced orders found.');
            return;
        }

        console.log(`🔄 Found ${unsyncedOrders.length} unsynced order(s), pushing to Shiprocket...`);

        for (const order of unsyncedOrders) {
            try {
                console.log(`📦 Attempting to sync order: ${order.displayId}`);
                const result = await shiprocket.createOrder(order);

                if (result.success) {
                    await Order.findByIdAndUpdate(order._id, {
                        shiprocketOrderId: result.shiprocketOrderId,
                        shiprocketShipmentId: result.shiprocketShipmentId,
                        trackingStatus: 'PROCESSING',
                        trackingLink: shiprocket.generateTrackingLink(result.shiprocketShipmentId)
                    });
                    console.log(`✅ Synced order to Shiprocket: ${order.displayId} → SR ID: ${result.shiprocketOrderId}`);
                } else {
                    // Save the error back to DB so you can see it in admin dashboard
                    await Order.findByIdAndUpdate(order._id, {
                        shiprocketError: result.error
                    });
                    console.warn(`⚠️  Shiprocket rejected order ${order.displayId}:`, result.error);
                }
            } catch (err) {
                console.error(`❌ Error syncing order ${order.displayId}:`, err.message);
            }
        }
    } catch (err) {
        console.error('❌ syncUnsyncedOrders error:', err.message);
    }
};

module.exports = function startCronJobs() {
    console.log('🕐 Cron jobs initialized...');

    // ── Run immediately when server starts ──
    syncUnsyncedOrders();
    cleanupOldProducts();
    cleanupOldUsers();

    // ── Shiprocket sync: every 5 minutes ──
    cron.schedule('*/5 * * * *', async () => {
        console.log('⏰ [Cron] Running Shiprocket sync check...');
        await syncUnsyncedOrders();
    });

    // ── Product Cleanup: Every day at midnight (00:00) ──
    cron.schedule('0 0 * * *', async () => {
        console.log('⏰ [Cron] Running daily cleanup (60-day rule for products & users)...');
        await cleanupOldProducts();
        await cleanupOldUsers();
    });
};