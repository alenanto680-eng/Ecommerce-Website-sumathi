import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import '../../styles/navbar/Footer.css';

export default function Footer() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLegalClick = (e, path) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (user) {
      navigate(path);
    } else {
      // Optional: save intended destination to redirect back after login
      // sessionStorage.setItem('redirectAfterLogin', path);
      navigate('/login');
    }
  };

  return (
    <>
      <footer className="premium-footer">
        <div className="footer-content">

          {/* Brand */}
          <div className="footer-brand">
            <div className="logo-wrapper">
              <div className="footer-logo-img">
                <img
                  src="/images/logo/logo.png"
                  alt="Sumathi Trends"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div className="footer-logo-text">Sumathi Trends</div>
            </div>
            <p className="brand-description">
              The best kids clothing store in Kodigehalli, Bangalore. 
              Elevating children's fashion through timeless design, premium
              materials, and exceptional craftsmanship since 2026.
            </p>
            <div className="social-links">
              <a href="https://www.facebook.com/share/14U8LwvzzXa/?mibextid=wwXIfr" className="social-icon" aria-label="Facebook">
                <img src="/images/icons/facebook.png" alt="FB" />
              </a>
              <a href="https://www.instagram.com/sumathitrends?igsh=MXE2OWtoeWNsZndz&utm_source=qr" className="social-icon" aria-label="Instagram">
                <img src="/images/icons/instagram.png" alt="IG" />
              </a>
              <a href="https://wa.me/918792888508" className="social-icon" aria-label="WhatsApp">
                <img src="/images/icons/whatsapp.png" alt="WA" />
              </a>
            </div>
          </div>

          {/* Useful Links */}
          <div className="footer-column">
            <h3>Useful Links</h3>
            <ul className="footer-links">
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); window.scrollTo(0, 0); }}>Home</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); navigate('/'); setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>About Us</a></li>
              <li><Link to="/collections" onClick={() => window.scrollTo(0, 0)}>Collections</Link></li>
              <li><a href="#reviews" onClick={(e) => { e.preventDefault(); navigate('/'); setTimeout(() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>Reviews</a></li>
              <li><Link to="/contact" onClick={() => window.scrollTo(0, 0)}>Contact Us</Link></li>
            </ul>
          </div>

          {/* Category */}
          <div className="footer-column">
            <h3>Category</h3>
            <ul className="footer-links">
              <li><Link to="/collections" state={{ category: 'Daily Wear Frocks' }} onClick={() => window.scrollTo(0, 0)}>Daily Wear Frocks</Link></li>
              <li><Link to="/collections" state={{ category: 'Party Wear Collection' }} onClick={() => window.scrollTo(0, 0)}>Party Wear Collection</Link></li>
              <li><Link to="/collections" state={{ category: 'Traditional & Ethnic Frocks' }} onClick={() => window.scrollTo(0, 0)}>Traditional & Ethnic</Link></li>
              <li><Link to="/collections" state={{ category: 'Designer & Premium Frocks' }} onClick={() => window.scrollTo(0, 0)}>Designer & Premium</Link></li>
              <li><Link to="/collections" state={{ category: 'Fabric-Based Categories' }} onClick={() => window.scrollTo(0, 0)}>Fabric Based</Link></li>
            </ul>
          </div>

          {/* Our Store */}
          <div className="footer-column">
            <h3>Our Store</h3>
            <ul className="contact-info">
              <li>
                <div className="contact-item">
                  <div className="contact-icon-circle">
                    <img src="/images/icons/map.png" alt="Location" />
                  </div>
                  <span>No.52, Saxena complex, Kodigehalli Main Rd,<br />Defence Layout, Sahakar Nagar,<br />Bengaluru, Karnataka 560092</span>
                </div>
              </li>
              <li>
                <div className="contact-item contact-item-center">
                  <div className="contact-icon-circle">
                    <img src="/images/icons/phone.png" alt="Phone" />
                  </div>
                  <span>+91 87928 88508</span>
                </div>
              </li>
              <li>
                <div className="contact-item contact-item-center">
                  <div className="contact-icon-circle">
                    <img src="/images/icons/gmail.png" alt="Email" />
                  </div>
                  <span>
                    <a href="mailto:sumathitrends.in@gmail.com">sumathitrends.in@gmail.com</a>
                  </span>
                </div>
              </li>
            </ul>
          </div>

        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <p>&copy; 2026 Sumathi Trends. All rights reserved.</p>
          <div className="legal-links">
            <button className="legal-link-btn" onClick={(e) => handleLegalClick(e, '/account/policy/privacy')}>
              Privacy Policy
            </button>
            <button className="legal-link-btn" onClick={(e) => handleLegalClick(e, '/account/policy/terms')}>
              Terms of Service
            </button>
            <button className="legal-link-btn" onClick={(e) => handleLegalClick(e, '/account/policy/refund')}>
              Refund &amp; Cancellation Policy
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
