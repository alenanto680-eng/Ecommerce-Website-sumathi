const mongoose = require('mongoose');

const supportIssueSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  customerId: { type: String }, // optional, for cross-reference
  orderId: { type: String, required: true }, // displayId (e.g. ST1001)
  description: { type: String, required: true },
  attachments: [{
    url: { type: String, required: true },
    fileType: { type: String, enum: ['image', 'video'], required: true }
  }],
  status: { type: String, default: 'Pending', enum: ['Pending', 'In Progress', 'Resolved'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupportIssue', supportIssueSchema);
