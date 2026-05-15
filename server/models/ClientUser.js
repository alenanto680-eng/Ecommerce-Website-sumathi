// server/models/ClientUser.js

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: String },
  name: { type: String },
  img: { type: String },
  price: { type: Number },
  size: { type: String },
  color: { type: String },
  qty: { type: Number, default: 1 },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const wishlistItemSchema = new mongoose.Schema({
  productId: { type: String },
  name: { type: String },
  img: { type: String },
  price: { type: String },
  category: { type: String },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String },
  items: [cartItemSchema],
  total: { type: Number },
  status: { type: String, default: 'placed' },
  placedAt: { type: Date, default: Date.now },
}, { _id: false });

const addressSchema = new mongoose.Schema({
  id: String,
  fullName: String,
  mobile: String,
  pincode: String,
  locality: String,
  address: String,
  city: String,
  state: String,
  landmark: String,
  altPhone: String,
  type: String,
  name: String,
  phone: String,
  line1: String,
  line2: String,
  isDefault: { type: Boolean, default: false },
}, { _id: false });

const clientUserSchema = new mongoose.Schema({

  uids: {
    type: [String],
    required: true,
    index: true,
  },

  // Stable human-readable ID shown in Admin (e.g. "CUST-00001").
  // Auto-generated on first login; never changes.
  customerId: {
    type: String,
    unique: true,
    sparse: true,
  },

  // Which provider this profile was created with ('google' or 'phone')
  loginTypes: {
    type: [String],
    enum: ['google', 'phone'],
    default: [],
  },

  name: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  photo: { type: String, default: '' },
  gender: { type: String, default: '' },

  addresses: { type: [addressSchema], default: [] },
  wishlist: { type: [wishlistItemSchema], default: [] },
  orders: { type: [orderSchema], default: [] },
  cart: { type: [cartItemSchema], default: [] },

  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });


module.exports = mongoose.model('ClientUser', clientUserSchema);