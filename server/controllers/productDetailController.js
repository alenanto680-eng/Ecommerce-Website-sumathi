// ── controllers/productDetailController.js ──
const ProductDetail = require('../models/ProductDetail');
const Product       = require('../models/Product');
const { uploadToS3, deleteFromS3 } = require('../conf/s3');

/* ─────────────────────────────────────────────
   GET /api/product-details/:productId   (public)
   Returns the detail document for a product.
───────────────────────────────────────────── */
const getProductDetail = async (req, res) => {
  try {
    const detail = await ProductDetail.findOne({ product: req.params.productId })
      .populate('product', 'name price oldPrice stars reviews inventory stock');

    if (!detail) return res.status(404).json({ success: false, message: 'Detail not found.' });
    res.json({ success: true, data: detail });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   GET /api/product-details/admin/:productId   (admin)
───────────────────────────────────────────── */
const getAdminProductDetail = async (req, res) => {
  try {
    const detail = await ProductDetail.findOne({ product: req.params.productId });
    // Return empty shell if not yet created so the form starts blank
    res.json({ success: true, data: detail || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   POST /api/product-details/admin/:productId  (admin)
   Creates or fully replaces the detail document.
   Accepts multipart/form-data with up to 7 image files
   (fields: image_0 … image_6).
───────────────────────────────────────────── */
const upsertProductDetail = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const parse = (key) => {
      const v = req.body[key];
      if (!v) return undefined;
      try { return JSON.parse(v); } catch { return v; }
    };

    const sizes            = parse('sizes')            || [];
    const colors           = parse('colors')           || [];
    const specifications   = parse('specifications')   || [];
    const manufacturerInfo = parse('manufacturerInfo') || [];
    const highlights       = parse('highlights')       || [];
    const inventory        = parse('inventory')        || {};
    const description      = req.body.description      || '';
    const deliveryDate     = req.body.deliveryDate      || '';

    // Calculate total stock from inventory map
    const stock = Object.values(inventory).reduce((acc, qty) => acc + (Number(qty) || 0), 0);

    // ── Handle per-color galleries ──
    // Client sends: colorGalleryExisting_<colorName> = JSON array of existing URLs
    // Client sends: colorImg_<colorName>_<idx> = new file uploads
    const existing = await ProductDetail.findOne({ product: productId });

    const colorGalleries = [];
    for (const color of colors) {
      const cName        = color.name.toLowerCase().replace(/\s+/g, '_');
      const existingUrls = parse(`colorGalleryExisting_${cName}`) || [];
      const images       = [];

      for (let i = 0; i < 7; i++) {
        const field = `colorImg_${cName}_${i}`;
        if (req.files && req.files[field] && req.files[field][0]) {
          const url = await uploadToS3(req.files[field][0], product.ageGroup);
          images.push(url);
        } else if (existingUrls[i]) {
          images.push(existingUrls[i]);
        }
      }

      // Delete replaced S3 images for this color
      if (existing) {
        const oldEntry = existing.colorGalleries?.find(g => g.colorName === cName);
        if (oldEntry) {
          for (let i = 0; i < 7; i++) {
            if (oldEntry.images[i] && oldEntry.images[i] !== images[i]) {
              await deleteFromS3(oldEntry.images[i]).catch(() => {});
            }
          }
        }
      }

      if (images.length > 0) {
        colorGalleries.push({ colorName: cName, images });
      }
    }

    // ── Fallback: also handle legacy flat galleryImages ──
    const existingUrls = parse('existingUrls') || [];
    const galleryImages = [];
    for (let i = 0; i < 7; i++) {
      const fileField = `image_${i}`;
      if (req.files && req.files[fileField] && req.files[fileField][0]) {
        const url = await uploadToS3(req.files[fileField][0], product.ageGroup);
        galleryImages.push(url);
      } else if (existingUrls[i]) {
        galleryImages.push(existingUrls[i]);
      }
    }

    // If no flat gallery provided but color galleries exist, use first color's images as default
    const finalGallery = galleryImages.length > 0
      ? galleryImages
      : (colorGalleries[0]?.images || []);

    if (finalGallery.length === 0) {
      return res.status(400).json({ success: false, message: 'At least 1 gallery image is required.' });
    }

    // Clean up old flat gallery images
    if (existing) {
      for (let i = 0; i < 7; i++) {
        const oldUrl = existing.galleryImages[i];
        if (oldUrl && oldUrl !== finalGallery[i]) {
          await deleteFromS3(oldUrl).catch(() => {});
        }
      }
    }

    const detail = await ProductDetail.findOneAndUpdate(
      { product: productId },
      {
        product: productId,
        galleryImages: finalGallery,
        colorGalleries,
        sizes,
        colors,
        deliveryDate,
        specifications,
        description,
        manufacturerInfo,
        highlights,
        inventory,
        stock,
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Sync colors, inventory and stock back to Product model for fast filtering and inventory management
    await Product.findByIdAndUpdate(productId, { colors, inventory, stock });

    res.json({ success: true, data: detail });
  } catch (err) {
    console.error('upsertProductDetail error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   DELETE /api/product-details/admin/:productId  (admin)
───────────────────────────────────────────── */
const deleteProductDetail = async (req, res) => {
  try {
    const detail = await ProductDetail.findOneAndDelete({ product: req.params.productId });
    if (!detail) return res.status(404).json({ success: false, message: 'Detail not found.' });

    // Clean up all gallery images from S3
    for (const url of detail.galleryImages) {
      await deleteFromS3(url).catch(() => {});
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProductDetail,
  getAdminProductDetail,
  upsertProductDetail,
  deleteProductDetail,
};