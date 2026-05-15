const express = require('express');
const router = express.Router();
const cmCtrl = require('../controllers/clientManagementController');
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

// General admin routes - allow all verified admins
router.use(protect);

router.get('/stats', cmCtrl.getStats);           // GET  /api/admin/clients/stats
router.get('/', cmCtrl.getAllClients);            // GET  /api/admin/clients
router.get('/:id', cmCtrl.getClientDetail);      // GET  /api/admin/clients/:id

// Sensitive migration route - strictly for superadmin only
router.post('/migrate', superAdminOnly, cmCtrl.migrateClients);  // POST /api/admin/clients/migrate

module.exports = router;