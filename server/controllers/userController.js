const AdminUser = require('../models/adminUserModel');

const getAllUsers = async (req, res) => {
  try {
    const users = await AdminUser.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, permissions } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    const exists = await AdminUser.findOne({ username: username.toLowerCase() });
    if (exists)
      return res.status(400).json({ success: false, message: 'Username already exists.' });
    
    // Create with specific role and permissions
    const user = await AdminUser.create({ 
      username: username.toLowerCase(), 
      password, 
      role: 'admin',
      permissions: permissions || [] 
    });

    res.status(201).json({
      success: true, 
      message: 'Admin user created.',
      data: { 
        _id: user._id, 
        username: user.username, 
        role: user.role, 
        isActive: user.isActive,
        permissions: user.permissions
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const toggleUser = async (req, res) => {
  try {
    const user = await AdminUser.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'superadmin')
      return res.status(403).json({ success: false, message: 'Cannot deactivate superadmin.' });
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ success: true, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await AdminUser.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'superadmin')
      return res.status(403).json({ success: false, message: 'Cannot delete superadmin.' });
    await AdminUser.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const user = await AdminUser.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'superadmin')
      return res.status(403).json({ success: false, message: 'Cannot modify superadmin permissions.' });
    
    user.permissions = permissions;
    await user.save();
    res.status(200).json({ success: true, permissions: user.permissions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both fields are required.' });
    const user = await AdminUser.findById(req.admin.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const match = await user.matchPassword(currentPassword);
    if (!match)
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const changeUsername = async (req, res) => {
  try {
    const { newUsername, currentPassword } = req.body;
    if (!newUsername || !currentPassword)
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    const user = await AdminUser.findById(req.admin.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const match = await user.matchPassword(currentPassword);
    if (!match)
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    const exists = await AdminUser.findOne({ username: newUsername.toLowerCase() });
    if (exists)
      return res.status(400).json({ success: false, message: 'Username already taken.' });
    user.username = newUsername.toLowerCase();
    await user.save();
    res.status(200).json({ success: true, message: 'Username changed successfully. Please log in again.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllUsers, createUser, toggleUser, deleteUser, updatePermissions, changePassword, changeUsername };