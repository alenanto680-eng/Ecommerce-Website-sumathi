// ── models/ProductDetail.js ──
const mongoose = require('mongoose');

const specSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const highlightSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const colorOptionSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    productName: { type: String, default: '' },
    hex:         { type: String, required: true },
    hexArray:    { type: [String], default: [] },
    price:       { type: Number, default: null },
  },
  { _id: false }
);

const productDetailSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
    },

    // Gallery — main image (index 0) + up to 6 additional = max 7
    // URLs stored after S3 upload
    galleryImages: {
      type: [String],
      validate: {
        validator: (v) => v.length >= 1 && v.length <= 7,
        message: 'galleryImages must have between 1 and 7 images.',
      },
      default: [],
    },

    // Per-color galleries — each entry maps a color name to its own image set
    // [ { colorName: 'green', images: ['url1', 'url2', ...] }, ... ]
    colorGalleries: {
      type: [{
        colorName: { type: String, required: true },
        images:    { type: [String], default: [] },
      }],
      default: [],
    },

    // Size options e.g. ["2-3Y","4-5Y","6-7Y","8-9Y"]
    sizes: {
      type: [String],
      default: [],
    },

    // Color swatches
    colors: {
      type: [colorOptionSchema],
      default: [],
    },

    // Delivery date string shown on the page e.g. "5 Mar, Thu"
    deliveryDate: { type: String, default: '' },

    // Accordion — Specifications tab (array of {label, value} rows)
    specifications: {
      type: [specSchema],
      default: [],
    },

    // Accordion — Description tab
    description: { type: String, default: '' },

    // Accordion — Manufacturer info (same key-value shape)
    manufacturerInfo: {
      type: [specSchema],
      default: [],
    },

    // Product highlights grid (array of {label, value})
    highlights: {
      type: [highlightSchema],
      default: [],
    },
    inventory: {
      type: Map,
      of: Number,
      default: {}
    },
    stock: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductDetail', productDetailSchema);