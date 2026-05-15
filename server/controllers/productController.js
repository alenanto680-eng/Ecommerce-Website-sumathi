const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const { uploadToS3, deleteFromS3 } = require('../conf/s3');

// ── Helpers ──────────────────────────────────────────────────────────────────

const stringHash = (str) => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

const parseArrayField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) {
    if (field.length === 1 && typeof field[0] === 'string' && field[0].startsWith('[')) {
      try { return JSON.parse(field[0]); } catch (e) { }
    }
    return field;
  }
  if (typeof field === 'string' && field.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) { }
  }
  return typeof field === 'string' && field.trim() ? [field.trim()] : (field ? [field] : []);
};

/**
 * Converts a Mongoose Map (or lean plain-object) inventory into a clean
 * { 'size': qty } plain object so the frontend always receives consistent data.
 */
const normaliseInventory = (product) => {
  if (!product) return product;
  if (product.inventory) {
    if (product.inventory instanceof Map) {
      product.inventory = Object.fromEntries(product.inventory);
    } else if (typeof product.inventory === 'object') {
      product.inventory = Object.fromEntries(
        Object.entries(product.inventory).map(([k, v]) => [k, Number(v) || 0])
      );
    }
  }
  return product;
};

// ── Controllers ───────────────────────────────────────────────────────────────

const getProducts = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.ageGroup) {
      const groups = req.query.ageGroup.split(',');
      filter.ageGroup = { $in: groups };
    }
    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: products });
  } catch {
    res.status(500).json({ success: false });
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const { section } = req.query;
    if (!section) return res.status(400).json({ success: false, message: 'section is required.' });

    const settings = await SiteSettings.findOne() || { autoRotateProducts: false };

    if (settings.autoRotateProducts) {
      const LIMITS = { youMightAlsoLike: 4, cartAlsoLike: 4, bestSelling: 10, newArrivals: 4 };
      const limit = LIMITS[section] || 4;
      const dateStr = new Date().toISOString().split('T')[0];
      const products = await Product.find({ isActive: true }).lean();
      const shuffled = products.sort((a, b) => {
        const hashA = stringHash(a._id.toString() + dateStr + section);
        const hashB = stringHash(b._id.toString() + dateStr + section);
        return hashA - hashB;
      });
      return res.json({ success: true, data: shuffled.slice(0, limit) });
    }

    const products = await Product.find({ isActive: true, featuredIn: section }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const getSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) settings = await SiteSettings.create({ autoRotateProducts: false });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { autoRotate } = req.body;
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({ autoRotateProducts: autoRotate });
    } else {
      settings.autoRotateProducts = autoRotate;
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: products.map(normaliseInventory) });
  } catch {
    res.status(500).json({ success: false });
  }
};

const createProduct = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image is required.' });

    let { name, category, subCategory, price, oldPrice, ageGroup, age, badge, sustainability, inventory, stock } = req.body;

    category = parseArrayField(category);
    subCategory = parseArrayField(subCategory);
    ageGroup = parseArrayField(ageGroup);

    let parsedInventory = {};
    if (inventory) {
      try {
        parsedInventory = typeof inventory === 'string' ? JSON.parse(inventory) : inventory;
      } catch (e) { }
    }

    const parsedStock = stock !== undefined ? Number(stock) : 0;
    const imgUrl = await uploadToS3(req.file, ageGroup[0] || 'other');

    const product = await Product.create({
      name,
      category,
      subCategory,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : null,
      ageGroup,
      age,
      img: imgUrl,
      badge: badge || null,
      sustainability: sustainability === 'true',
      inventory: parsedInventory,
      stock: parsedStock,
    });

    res.json({ success: true, data: normaliseInventory(product.toObject()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false });

    let { name, category, subCategory, price, oldPrice, ageGroup, age, badge, sustainability, isActive, featuredIn, inventory, stock } = req.body;

    if (name) product.name = name;
    if (category !== undefined) product.category = parseArrayField(category);
    if (subCategory !== undefined) product.subCategory = parseArrayField(subCategory);
    if (price) product.price = Number(price);
    if (oldPrice !== undefined) product.oldPrice = oldPrice ? Number(oldPrice) : null;
    if (ageGroup !== undefined) product.ageGroup = parseArrayField(ageGroup);
    if (age) product.age = age;
    if (badge !== undefined) product.badge = badge || null;
    if (sustainability !== undefined) product.sustainability = sustainability === 'true';
    if (isActive !== undefined) product.isActive = isActive === 'true';
    if (stock !== undefined && stock !== '') product.stock = Number(stock);

    if (featuredIn !== undefined) {
      product.featuredIn = Array.isArray(featuredIn) ? featuredIn : JSON.parse(featuredIn);
    }

    // Always save inventory when provided — no length guard so 0-qty entries persist too
    if (inventory !== undefined) {
      try {
        const parsed = typeof inventory === 'string' ? JSON.parse(inventory) : inventory;
        if (parsed && typeof parsed === 'object') {
          product.inventory = parsed;
          product.markModified('inventory');
        }
      } catch (e) {
        console.error('inventory parse error:', e);
      }
    }

    if (req.file) {
      await deleteFromS3(product.img);
      const parsedAgeGroup = ageGroup !== undefined ? parseArrayField(ageGroup) : product.ageGroup;
      product.img = await uploadToS3(req.file, parsedAgeGroup[0] || product.ageGroup[0] || 'other');
    }

    await product.save();

    res.json({ success: true, data: normaliseInventory(product.toObject()) });
  } catch (err) {
    console.error('updateProduct error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false });
    await deleteFromS3(product.img);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
};

module.exports = {
  getProducts,
  getFeaturedProducts,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getSettings,
  updateSettings,
};