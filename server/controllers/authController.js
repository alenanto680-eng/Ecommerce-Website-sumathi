const jwt = require('jsonwebtoken');

const HARDCODED_ADMINS = {
  'sumathia': {
    password: 'Sumathiraj@2026',
    role: 'superadmin',
    permissions: [
      'Contact Messages',
      'Review Management',
      'Product Management',
      'Client Management',
      'Payment Management',
      'Order Management',
      'Support Management'
    ]
  },
  'sumathi': {
    password: 'Sumathiraj@2026',
    role: 'superadmin',
    permissions: [
      'Contact Messages',
      'Review Management',
      'Product Management',
      'Client Management',
      'Payment Management',
      'Order Management',
      'Support Management'
    ]
  },
  'sumathitrends': {
    password: 'Sumathitrends@2026',
    role: 'admin',
    permissions: [
      'Product Management',
      'Order Management',
      'Support Management'
    ]
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const lowerUsername = (username || '').toLowerCase().trim();

    const admin = HARDCODED_ADMINS[lowerUsername];

    if (admin && admin.password === password) {
      const token = jwt.sign(
        { 
          id: `static_${lowerUsername}`, 
          username: lowerUsername, 
          role: admin.role,
          isStatic: true 
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.cookie('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 8 * 60 * 60 * 1000,
      });

      return res.status(200).json({ 
        success: true, 
        role: admin.role,
        permissions: admin.permissions 
      });
    }

    // If not in hardcoded list or password mismatch
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('adminToken');
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

const getMe = async (req, res) => {
  try {
    if (req.admin && req.admin.isStatic) {
      const admin = HARDCODED_ADMINS[req.admin.username];
      if (admin) {
        return res.status(200).json({ 
          success: true, 
          user: { 
            id: req.admin.id, 
            username: req.admin.username, 
            role: admin.role,
            permissions: admin.permissions
          } 
        });
      }
    }
    res.status(401).json({ success: false, message: 'Unauthorized.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { login, logout, getMe };