import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import '../../styles/policy/policy.css';

// ─── Privacy Policy ───────────────────────────────────────────────────────────

function PrivacyPolicyContent() {
  return (
    <div className="policy-page-body">
      <p className="policy-page-intro">
        This Privacy Policy describes how Sumathi Trends collects, uses, and
        protects your information when you use our website.
      </p>

      <section>
        <h3>1. Information We Collect</h3>
        <p>
          We may collect your name, email address, phone number, shipping and
          billing address, payment details (processed securely via third-party
          providers), as well as device and browsing information.
        </p>
      </section>

      <section>
        <h3>2. How We Use Your Information</h3>
        <p>
          We use your information to process and deliver orders, communicate
          with you regarding your orders, improve our services and website, and
          prevent fraudulent transactions.
        </p>
      </section>

      <section>
        <h3>3. Payment Information</h3>
        <p>
          We do not store your card or payment details. Payments are securely
          processed through trusted third-party payment gateways.
        </p>
      </section>

      <section>
        <h3>4. Data Sharing</h3>
        <p>
          We do not sell or rent your personal data. However, your information
          may be shared with payment providers, shipping partners, and legal
          authorities when required by law.
        </p>
      </section>

      <section>
        <h3>5. Cookies</h3>
        <p>
          We may use cookies to enhance your browsing experience and analyze
          website traffic.
        </p>
      </section>

      <section>
        <h3>6. Data Security</h3>
        <p>
          We implement reasonable security measures to protect your personal
          data.
        </p>
      </section>

      <section>
        <h3>7. Your Rights</h3>
        <p>
          You may contact us to access your data, request corrections, or
          request deletion, subject to applicable legal obligations.
        </p>
      </section>

      <section>
        <h3>8. Changes to Policy</h3>
        <p>
          We may update this policy at any time without prior notice.
        </p>
      </section>

      <section>
        <h3>9. Contact Us</h3>
        <ul>
          <li>For any questions, contact us at:</li>
          <li>Email: <a href="mailto:sumathitrends.in@gmail.com">sumathitrends.in@gmail.com</a></li>
          <li>Phone: +91 87928 88508</li>
          <li>
            Address: No.52, Saxena complex, Kodigehalli Main Rd, Defence Layout,
            Sahakar Nagar, Bengaluru, Karnataka 560092
          </li>
        </ul>
      </section>
    </div>
  );
}

// ─── Terms & Conditions ───────────────────────────────────────────────────────

function TermsConditionsContent() {
  return (
    <div className="policy-page-body">
      <p className="policy-page-intro">
        By using this website, you agree to the following terms:
      </p>

      <section>
        <h3>1. General</h3>
        <p>
          Sumathi Trends operates this website. By accessing it, you agree to be
          bound by these terms.
        </p>
      </section>

      <section>
        <h3>2. Products & Services</h3>
        <p>
          We strive to ensure all product details and prices are accurate.
          However, errors may occur and we reserve the right to correct them.
        </p>
      </section>

      <section>
        <h3>3. Orders</h3>
        <p>
          All orders are subject to availability and acceptance. We reserve the
          right to cancel any order due to unforeseen issues.
        </p>
      </section>

      <section>
        <h3>4. Pricing</h3>
        <p>
          Prices are subject to change without prior notice.
        </p>
      </section>

      <section>
        <h3>5. Payments</h3>
        <p>
          All payments must be made in full at the time of purchase through the
          available payment methods.
        </p>
      </section>

      <section>
        <h3>6. Shipping</h3>
        <p>
          Delivery timelines are estimates and may vary depending on location
          and external factors.
        </p>
      </section>

      <section>
        <h3>7. No Cancellation & No Refund Policy</h3>
        <p>
          All purchases made on our website are final. Orders cannot be
          cancelled once placed, and no refunds will be provided under any
          circumstances.
        </p>
      </section>

      <section>
        <h3>8. Limitation of Liability</h3>
        <p>
          We are not responsible for delays in delivery or any indirect or
          incidental damages.
        </p>
      </section>

      <section>
        <h3>9. Intellectual Property</h3>
        <p>
          All content on this website is owned by Sumathi Trends and cannot be
          used without permission.
        </p>
      </section>

      <section>
        <h3>10. Governing Law</h3>
        <p>
          These terms are governed by the laws of India.
        </p>
      </section>

      <section>
        <h3>11. Contact</h3>
        <p>
          You can contact us via email:{" "}
          <a href="mailto:sumathitrends.in@gmail.com">
            sumathitrends.in@gmail.com
          </a>{" "}
          or phone: +91 87928 88508.
        </p>
      </section>
    </div>
  );
}

// ─── Refund & Cancellation ────────────────────────────────────────────────────

function RefundPolicyContent() {
  return (
    <div className="policy-page-body">
      <p className="policy-page-intro">
        At Sumathi Trends, we maintain a strict{" "}
        <strong>No Refund and No Cancellation Policy</strong>.
      </p>

      <section>
        <h3>1. No Cancellation</h3>
        <p>
          Once an order is placed, it cannot be cancelled under any
          circumstances.
        </p>
      </section>

      <section>
        <h3>2. No Refund</h3>
        <p>
          We do not offer refunds for any products or services once the order is
          confirmed.
        </p>
      </section>

      <section>
        <h3>3. Exceptions</h3>
        <p>
          Refunds or replacements will only be considered in cases where the
          wrong product is delivered or the product is damaged, provided proof
          is submitted within 24 hours of delivery. In such situations,
          customers must contact us immediately with proper evidence.
        </p>
      </section>

      <section>
        <h3>4. Replacement Policy</h3>
        <p>
          If eligible, a replacement will be processed instead of a refund.
        </p>
      </section>

      <section>
        <h3>5. Contact for Issues</h3>
        <p>
          For any issues, contact us within 24 hours of delivery via email:{" "}
          <a href="mailto:sumathitrends.in@gmail.com">
            sumathitrends.in@gmail.com
          </a>{" "}
          or phone: +91 87928 88508.
        </p>
      </section>

      <section>
        <h3>6. Policy Updates</h3>
        <p>
          We reserve the right to modify this policy at any time without prior
          notice.
        </p>
      </section>
    </div>
  );
}

// ─── Meta map ─────────────────────────────────────────────────────────────────

const POLICY_META = {
  privacy: {
    title: 'Privacy Policy',
    content: <PrivacyPolicyContent />,
  },
  terms: {
    title: 'Terms of Service',
    content: <TermsConditionsContent />,
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    content: <RefundPolicyContent />,
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Policy() {
  const { type } = useParams();
  const navigate = useNavigate();
  const meta = POLICY_META[type] || POLICY_META.privacy;

  const [activeNav, setActiveNav] = useState('policy');
  const [activeSubNav, setActiveSubNav] = useState(type || 'privacy');
  const [mainHeight, setMainHeight] = useState(null);

  const sidebarRef = useRef(null);
  const cardRef = useRef(null);

  // Scroll to top instantly every time the policy type changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (cardRef.current) cardRef.current.scrollTop = 0;
  }, [type]);

  useEffect(() => {
    setActiveNav('policy');
    setActiveSubNav(type || 'privacy');
  }, [type]);

  // Measure sidebar height and keep main panel in sync
  useEffect(() => {
    const sidebarEl = sidebarRef.current;
    if (!sidebarEl) return;

    const update = () => setMainHeight(sidebarEl.offsetHeight);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(sidebarEl);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="policy-page">
      <div className="policy-container">
        <div ref={sidebarRef}>
          <Sidebar
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            activeSubNav={activeSubNav}
            setActiveSubNav={setActiveSubNav}
          />
        </div>

        <main
          className="policy-main"
          style={mainHeight ? { height: mainHeight + 'px' } : {}}
        >

          <div className="policy-mobile-header">
            <button className="mobile-back-btn" onClick={() => navigate('/account')}>
            </button>
            <div className="policy-content-header">
              <h1>{meta.title}</h1>
            </div>
          </div>
          <div className="policy-card" ref={cardRef}>{meta.content}</div>
        </main>
      </div>
    </div>
  );
}