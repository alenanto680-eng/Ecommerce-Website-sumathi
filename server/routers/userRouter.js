const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

const protect        = authMiddleware.protect;
const superAdminOnly = authMiddleware.superAdminOnly;
const getAllUsers     = userController.getAllUsers;
const createUser     = userController.createUser;
const toggleUser     = userController.toggleUser;
const deleteUser     = userController.deleteUser;
const updatePermissions = userController.updatePermissions;
const changePassword = userController.changePassword;
const changeUsername = userController.changeUsername;

router.get('/',                  protect, superAdminOnly, getAllUsers);
router.post('/',                 protect, superAdminOnly, createUser);
router.patch('/:id/toggle',      protect, superAdminOnly, toggleUser);
router.patch('/:id/permissions', protect, superAdminOnly, updatePermissions);
router.delete('/:id',            protect, superAdminOnly, deleteUser);
router.patch('/change-password', protect, superAdminOnly, changePassword);
router.patch('/change-username', protect, superAdminOnly, changeUsername);

module.exports = router;