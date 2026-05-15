const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
  autoRotateProducts: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);
