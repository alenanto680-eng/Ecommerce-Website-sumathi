import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import '../../styles/myorders/MyOrders.css';

function StatusBadge({ status, label }) {
  const displayLabel = label || (status === 'success' ? 'Confirmed' : status.charAt(0).toUpperCase() + status.slice(1));
  return (
    <div className="mo-status-badge">
      <span className={`mo-status-dot ${status}`} />
      <span className={`mo-status-text ${status}`}>{displayLabel}</span>
    </div>
  );
}

export default function MyOrders() {
  const navigate = useNavigate();
  const [dbOrders, setDbOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch(`/api/payment/user-orders/${firebaseUser.uid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setDbOrders(data.data);
          }
        } catch (err) {
          console.error("Failed to fetch orders", err);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsub();
  }, [navigate]);

  if (loading) {
    return (
      <div className="account-loading-wrapper">
        <div className="account-loading-spinner"></div>
        <p>Loading your Orders...</p>
      </div>
    );
  }

  const filtered = dbOrders.filter(order => {
    // Process query: remove '#' if user typed it at the start
    const searchLower = query.toLowerCase().replace('#', '').trim();
    if (!searchLower) return true;

    // Check if any item in the order matches search
    const matchesItems = order.items?.some(item =>
      item.name?.toLowerCase().includes(searchLower) ||
      item.color?.toLowerCase().includes(searchLower)
    );

    // Check if Order IDs match
    const matchesOrderId = order.orderId?.toLowerCase().includes(searchLower);
    const matchesDisplayId = order.displayId?.toLowerCase().includes(searchLower);

    return matchesItems || matchesOrderId || matchesDisplayId;
  });

  return (
    <div className="mo-page">
      <div className="mo-content">

        <div className="mo-mobile-header">
          <button className="mobile-back-btn" onClick={() => navigate('/account')}>
          </button>
          <div className="mo-header">
            <h1>My Orders History</h1>
            <p>View and track your recent boutique purchases.</p>
          </div>
        </div>

        {/* Search */}
        <div className="mo-search-row">
          <div className="mo-search-input-wrapper">
            <img src="/images/myorders/search.png" alt="search" className="mo-search-icon-img" />
            <input
              type="text"
              className="mo-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setQuery(search); }}
              placeholder="Search by product name or order ID"
            />
          </div>
          <button className="mo-search-btn" onClick={() => setQuery(search)}>
            Search Orders
          </button>
        </div>

        {/* Orders List */}
        <div className="mo-list">
          {dbOrders.length === 0 ? (
            <div className="mo-empty">
              <p>You haven't placed any orders yet.</p>
              <button className="mo-shop-btn" onClick={() => navigate('/collections')}>Start Shopping</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mo-empty">
              <p>No orders found matching your search.</p>
            </div>
          ) : (
            filtered.map(order => (
              <div key={order._id} className="mo-card">
                {order.items?.map((item, idx) => (
                  <div
                    key={`${order._id}-${idx}`}
                    className="mo-card-top"
                    onClick={() => navigate(`/account/orders/${order.orderId}`, { state: { order, item } })}
                    style={{
                      borderBottom: idx < order.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                      marginBottom: '10px',
                      paddingBottom: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <img src={item.img || item.photo} alt={item.name} className="mo-card-img" />

                    <div className="mo-card-info">
                      <div className="mo-card-name">{item.name}</div>
                      <div className="mo-card-meta">
                        {item.color && `Color: ${item.color}`} {item.size && ` | Size: ${item.size}`}
                        {item.qty > 1 && ` | Qty: ${item.qty}`}
                      </div>
                      <div className="mo-card-price">{String(item.price).includes('₹') ? item.price : `₹${item.price?.toLocaleString()}`}</div>
                    </div>

                    <div className="mo-card-status">
                      <StatusBadge
                        status={order.status}
                        label={order.status === 'success' ? `Paid on ${new Date(order.createdAt).toLocaleDateString()}` : 'Payment Pending'}
                      />
                      <div className="mo-status-sub">Order ID: #{order.displayId}</div>
                      {order.trackingStatus?.toLowerCase() === 'delivered' && (
                        <button
                          className="mo-review-btn"
                          onClick={(e) => { e.stopPropagation(); navigate('/account/write-review', { state: { order, item } }); }}
                        >☆ Rate &amp; Review Product</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Pagination (Simplified for now) */}
        {filtered.length > 5 && (
          <div className="mo-pagination">
            <button className="mo-page-btn" disabled>‹</button>
            <button className="mo-page-btn active">1</button>
            <button className="mo-page-btn" disabled>›</button>
          </div>
        )}

      </div>
    </div>
  );
}