const Contact = require('../models/contactModel');

// ── POST /api/contact  (public — called from the Contact page form)
const submitContact = async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({ success: false, message: 'Name, phone, and message are required.' });
    }

    const entry = await Contact.create({ name, phone, email, subject, message });

    res.status(201).json({ success: true, message: 'Message sent successfully.', data: entry });
  } catch (error) {
    console.error('submitContact error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ── GET /api/admin/contacts  (admin — list all submissions)
const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    console.error('getAllContacts error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/admin/contacts/:id  (admin — view single submission)
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }
    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    console.error('getContactById error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── DELETE /api/admin/contacts/:id  (admin — delete a submission)
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }
    res.status(200).json({ success: true, message: 'Contact deleted successfully.' });
  } catch (error) {
    console.error('deleteContact error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { submitContact, getAllContacts, getContactById, deleteContact };