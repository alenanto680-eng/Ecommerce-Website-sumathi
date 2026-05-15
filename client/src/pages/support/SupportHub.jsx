import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import SEO from '../../components/SEO';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import '../../styles/support/SupportHub.css';

const API = '/api';

export default function SupportHub() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  const [search, setSearch] = useState('');
  const [activeNav, setActiveNav] = useState('');
  const [activeSubNav, setActiveSubNav] = useState('support');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          const res = await fetch(`${API}/payment/user-orders/${fbUser.uid}`, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          const data = await res.json();
          if (data.success) {
            // Filter only delivered orders and sort by date descending
            const delivered = data.data
              .filter(o => o.trackingStatus?.toLowerCase() === 'delivered')
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(delivered.slice(0, 5)); // Show 5 most recent
          }
        } catch (err) {
          console.error("SupportHub: Failed to fetch orders", err);
        }
      } else {
        setOrders([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="sh-page">
      <SEO 
        title="Support Hub"
        description="Welcome to Sumathi Trends Support Hub. Find help with your orders, track shipments, and get answers to your questions about our premium kids products."
        keywords="Sumathi Trends support, kids clothing help, order tracking Bengaluru, children fashion assistance"
        url="https://sumathitrends.com/support"
      />
      <div className="sh-container">

        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          activeSubNav={activeSubNav}
          setActiveSubNav={setActiveSubNav}
        />

        <main className="sh-main">

          {/* Hero Banner */}
          <div className="sh-hero">
            <div className="sh-mobile-header">
              <button className="mobile-back-btn" onClick={() => navigate('/account')}>
              </button>
              <h1 className="sh-hero-title">Sumathi Trends Support Hub</h1>
            </div>
            <p className="sh-hero-sub">Experience seamless assistance for your little one's wardrobe.</p>
            <div className="sh-search-wrap">
              <input
                className="sh-search-input"
                placeholder="Search order using order ID"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="sh-search-btn">Search</button>
            </div>
          </div>

          <div className="sh-body">

            {/* Recent Orders */}
            <section className="sh-section">
              <h2 className="sh-section-title">Help with recent orders</h2>
              <div className="sh-orders-scroll-container">
                <div className="sh-orders-list">
                  {loading ? (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Loading orders...</p>
                  ) : orders.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No delivered orders found.</p>
                  ) : (
                    orders.map((order) => {
                      return (
                        <div 
                          key={order._id} 
                          className="sh-order-card sh-order-card--multi"
                        >
                          <div className="sh-order-header-row">
                            <div className="sh-order-label">ORDER #{order.displayId}</div>
                            <div className="sh-order-status">
                              Status: <span className="sh-status-delivered">Delivered</span>
                            </div>
                          </div>

                          <div className="sh-order-body-row">
                            <div className="sh-order-items-list">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="sh-order-item-row">
                                  <img
                                    src={item.image || item.img || item.photo || '/logo.png'}
                                    alt={item.name}
                                    className="sh-order-img"
                                  />
                                  <div className="sh-order-info">
                                    <div className="sh-order-id">{item.name}</div>
                                    <div className="sh-order-item-meta">
                                      {item.size ? `Size: ${item.size}` : ''} 
                                      {item.qty > 1 ? ` | Qty: ${item.qty}` : ''}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="sh-order-actions-side">
                              <button
                                className="sh-need-help-btn"
                                onClick={() => navigate('/support/order-help', { state: { order } })}
                              >
                                Need help?
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
