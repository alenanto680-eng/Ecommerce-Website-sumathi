import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import { useState } from 'react';
import '../../styles/support/SupportHub.css';

export default function OrderHelp() {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order || null;

  const [activeNav, setActiveNav] = useState('');
  const [activeSubNav, setActiveSubNav] = useState('support');

  return (
    <div className="sh-page">
      <div className="sh-container">

        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          activeSubNav={activeSubNav}
          setActiveSubNav={setActiveSubNav}
        />

        <main className="sh-main">

          {/* Header */}
          <div className="sh-hero sh-hero--compact">
            <div className="sh-mobile-header">
              <button className="mobile-back-btn" onClick={() => navigate('/support')}>
              </button>
              <h1 className="sh-hero-title">Sumathi Trends Support Hub</h1>
            </div>
            <p className="sh-hero-sub">Experience seamless assistance for your little one's wardrobe.</p>
          </div>

          <div className="sh-body sh-body--stretch">

            {/* Order info strip */}
            {order && (
              <div className="sh-oh-order-strip-wrapper">
                <div className="sh-oh-order-strip">
                  <img src={order.items?.[0]?.image || order.items?.[0]?.img || order.items?.[0]?.photo || '/logo.png'} alt="Product" className="sh-order-img" />
                  <div className="sh-order-info">
                    <div className="sh-order-label">ORDER #{order.displayId}</div>
                    <div className="sh-order-id">
                      {order.items?.length > 1 
                        ? `${order.items[0].name} + ${order.items.length - 1} more` 
                        : (order.items?.[0]?.name || 'Product')}
                    </div>
                    <div className="sh-order-status">
                      Status: <span className="sh-status-delivered">Delivered</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Still need help */}
            <section className="sh-still-section sh-still-section--stretch">
              <div className="sh-connect-box">
                <h2 className="sh-still-title">Ways to connect for <br/> Order #{order?.displayId}</h2>
                <div className="sh-channels sh-channels--two">
                  <div className="sh-channel-card" onClick={() => navigate('/support/chat', { state: { order } })} style={{ cursor: 'pointer' }}>
                    <div className="sh-channel-icon">
                      <img src="/images/support/chat.png" alt="Chat" />
                    </div>
                    <div>
                      <div className="sh-channel-title">Chat with us</div>
                      <div className="sh-channel-sub">Get instant support for your queries.</div>
                    </div>
                  </div>
                  <div className="sh-channel-card" onClick={() => window.location.href = `mailto:sumathitrends.in@gmail.com?subject=Help with Order ${order?.displayId}`}>
                    <div className="sh-channel-icon">
                      <img src="/images/support/email.png" alt="Email" />
                    </div>
                    <div>
                      <div className="sh-channel-title">Email us</div>
                      <div className="sh-channel-sub">
                        sumathitrends.in@gmail.com</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
