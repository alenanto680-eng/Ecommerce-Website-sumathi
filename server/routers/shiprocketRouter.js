const express = require('express');
const router = express.Router();
const shiprocketCtrl = require('../controllers/shiprocketController');

router.get('/check-pincode/:pincode', shiprocketCtrl.checkPincode);

module.exports = router;
