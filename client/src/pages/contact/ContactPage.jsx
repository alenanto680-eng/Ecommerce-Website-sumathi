import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import '../../styles/contact/ContactPage.css';

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const [form, setForm] = useState({ name: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name' || name === 'subject') {
      if (/^[a-zA-Z\s]*$/.test(value)) {
        setForm(f => ({ ...f, [name]: value }));
      }
    } else if (name === 'phone') {
      if (/^[0-9]*$/.test(value) && value.length <= 10) {
        setForm(f => ({ ...f, [name]: value }));
      }
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.message) {
      alert('Name, phone number and message are required.');
      return;
    }
    if (form.phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Could not connect to server. Please try again.');
    }
  };

  return (
    <div className="contact-page">
      <SEO 
        title="Contact Us"
        description="Get in touch with Sumathi Trends. We are here to help you with any questions about our kids clothing, sizing, or shipping. Visit our Bengaluru store."
        keywords="contact Sumathi Trends, kids clothing store Bengaluru, customer support kids clothes, Bengaluru kids boutique contact"
        url="https://sumathitrends.com/contact"
      />
      <div className="nav-spacer" />

      {/* ── Body ── */}
      <section className="contact-body">
        <div className="contact-inner">

          {/* ── Breadcrumb ── */}


          {/* ── Left ── */}
          <div className="contact-left">
            <h2 className="contact-heading">
              We are here to help you and your little ones.
            </h2>
            <p className="contact-sub">
              Have a question about sizing, shipping, or our sustainable materials?
              Our team is ready to assist you.
            </p>

            <div className="contact-info-list">
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <img src="/images/icons/gmail.png" alt="Email" className="contact-info-img" />
                </div>
                <div>
                  <p className="contact-info-label">Email Us</p>
                  <p className="contact-info-value">sumathitrends.in@gmail.com</p>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <img src="/images/icons/phone.png" alt="Phone" className="contact-info-img" />
                </div>
                <div>
                  <p className="contact-info-label">Call Us</p>
                  <p className="contact-info-value">+91 87928 88508</p>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <img src="/images/icons/map.png" alt="Location" className="contact-info-img" />
                </div>
                <div>
                  <p className="contact-info-label">Visit Us</p>
                  <p className="contact-info-value">
                    No.52, Saxena complex, Kodigehalli Main Rd,<br />
                    Defence Layout, Sahakar Nagar,<br />
                    Bengaluru, Karnataka 560092
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right ── */}
          <div className="contact-right">
            {!sent && <h3 className="contact-form-title">Send us a Message</h3>}
            {sent ? (
              <div className="contact-success">
                <p>✓ Thank you! We'll get back to you shortly.</p>
              </div>
            ) : (
              <div className="contact-form">
                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label>Name <span className="contact-required">*</span></label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="contact-form-group">
                    <label>Phone Number <span className="contact-required">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Your Phone Number"
                      value={form.phone}
                      onChange={handleChange}
                      maxLength={10}
                    />
                  </div>
                </div>
                <div className="contact-form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    name="subject"
                    placeholder="Enter your subject"
                    value={form.subject}
                    onChange={handleChange}
                  />
                </div>
                <div className="contact-form-group">
                  <label>Message <span className="contact-required">*</span></label>
                  <textarea
                    name="message"
                    placeholder="How can we help you?"
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                  />
                </div>
                <button className="contact-submit" onClick={handleSubmit}>
                  SEND MESSAGE
                </button>
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
