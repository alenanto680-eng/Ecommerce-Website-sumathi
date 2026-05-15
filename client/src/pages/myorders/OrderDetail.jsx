import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import '../../styles/myorders/OrderDetail.css';
import OrderInvoice from './OrderInvoice';
import { authFetch } from '../../utils/authFetch';


function SimplifiedTracker({ trackingData, orderDate, onSeeAll }) {
  // Use same logic as modal
  const formatStatus = (status) => {
    if (!status) return '';
    const s = status.toUpperCase();
    const mapping = {
      'PICKED_UP': 'Shipment Picked Up',
      'IN_TRANSIT': 'In Transit',
      'OUT_FOR_DELIVERY': 'Out for Delivery',
      'OFD': 'Out for Delivery',
      'DELIVERED': 'Delivered',
      'DELIVERY_UPDATE': 'Delivered',
      'RECEIVED_AT_DH': 'In Transit',
      'MH_RECEIVED': 'In Transit',
      'SHIPPED': 'Shipped',
      'LPD_GENERATED': 'Shipment Ready',
      'CREATED': 'Order Created'
    };
    return mapping[s] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const activities = (trackingData?.activities || []).filter(a => {
    const s = a.status?.toLowerCase() || '';
    return !s.includes('metadata') && !s.includes('tracking_id') && !s.includes('awb_code');
  });
  
  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  let latestStep = { label: 'Processing', date: orderDate };
  if (activities.length > 0) {
    const last = activities[0];
    latestStep = { label: formatStatus(last.status), date: last.date };
  }

  return (
    <div className="simple-tracker-wrap">
      <div className="simple-tracker">
        <div className="s-step completed">
          <div className="s-dot-wrap"><div className="s-dot" /><div className="s-line" /></div>
          <div className="s-text">Order Confirmed, {formatDateShort(orderDate)}</div>
        </div>
        <div className={`s-step ${latestStep.label !== 'Processing' ? 'completed' : ''} ${latestStep.label === 'Delivered' ? 'delivered' : ''}`}>
          <div className="s-dot-wrap"><div className="s-dot" /></div>
          <div className="s-text">{latestStep.label}, {formatDateShort(latestStep.date)}</div>
        </div>
      </div>
      <button className="see-all-btn" onClick={onSeeAll}>
        See All Updates ›
      </button>
    </div>
  );
}

function TrackingModal({ isOpen, onClose, trackingData, orderDate }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Status Mapping Helper
  const formatStatus = (status) => {
    if (!status) return '';
    const s = status.toUpperCase();
    const mapping = {
      'PICKED_UP': 'Shipment Picked Up',
      'IN_TRANSIT': 'In Transit',
      'OUT_FOR_DELIVERY': 'Out for Delivery',
      'OFD': 'Out for Delivery',
      'DELIVERED': 'Delivered',
      'DELIVERY_UPDATE': 'Delivered',
      'RECEIVED_AT_DH': 'Reached Destination Hub',
      'MH_RECEIVED': 'Reached Processing Center',
      'SHIPPED': 'Shipped',
      'LPD_GENERATED': 'Shipment Ready',
      'CREATED': 'Order Created',
      'EXPECTED': 'Scheduled for Delivery',
      'UNDELIVERED_ATTEMPTED': 'Delivery Attempted',
      'REPROMISE': 'Delivery Rescheduled',
      'EOD-135': 'Delivered',
      'ST-114': 'Dispatched',
      'X-DDD3FD': 'Out for Delivery'
    };
    return mapping[s] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // 2. Filter internal metadata
  const activities = (trackingData?.activities || []).filter(a => {
    const s = a.status?.toLowerCase() || '';
    return !s.includes('metadata') && !s.includes('tracking_id') && !s.includes('awb_code');
  });

  const courier = trackingData?.courier || 'Logistic Partner';
  const awb = trackingData?.awb || '';

  const getDay = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' });
  const getTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

  return (
    <div className="od-modal-overlay" onClick={onClose}>
      <div className="od-modal-content" onClick={e => e.stopPropagation()}>
        <div className="od-modal-header">
          <h3>Tracking Updates</h3>
          <button className="od-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="od-modal-body">
          <div className="full-tracker">
            {activities.length === 0 && (
              <div className="full-step active">
                 <div className="fs-dot-line"><div className="fs-dot"/><div className="fs-line"/></div>
                 <div className="fs-info">
                   <div className="fs-label">Order Confirmed <span className="fs-date">{getDay(orderDate)}</span></div>
                   <p className="fs-msg">Your order has been placed and is being processed.</p>
                   <p className="fs-time">{getDay(orderDate)} - {getTime(orderDate)}</p>
                 </div>
              </div>
            )}
            {activities.map((a, i) => (
              <div key={i} className={`full-step active ${a.status?.toLowerCase().includes('delivered') ? 'delivered-step' : ''}`}>
                <div className="fs-dot-line">
                  <div className="fs-dot" />
                  {i < activities.length - 1 && <div className="fs-line" />}
                </div>
                <div className="fs-info">
                  <div className="fs-label">{formatStatus(a.status)} <span className="fs-date">{getDay(a.date)}</span></div>
                  {i === 0 && awb && <p className="fs-courier">{courier} - {awb}</p>}
                  <p className="fs-msg">{a.activity || (a.status?.toLowerCase().includes('delivered') ? 'Order successfully delivered.' : '')}</p>
                  <p className="fs-time">{getDay(a.date)} - {getTime(a.date)}</p>
                  {a.location && <p className="fs-loc">{a.location}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="od-stars">
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          className={`od-star ${s <= (hover || value) ? 'active' : ''}`}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
        >★</span>
      ))}
    </div>
  );
}

export default function OrderDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  const { order: stateOrder, item } = location.state || {}; // Rename to stateOrder
  const [order, setOrder] = useState(stateOrder); // Local order state to handle refreshes
  const [rating, setRating] = useState(0);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Robust delivery check
  const isDelivered = 
    order?.trackingStatus?.toUpperCase() === 'DELIVERED' || 
    trackingData?.trackingStatus?.toUpperCase() === 'DELIVERED' ||
    (trackingData?.activities && trackingData.activities.some(a => {
      const s = a.status?.toLowerCase() || '';
      return s === 'delivered' || s === 'delivery_update' || s.includes('delivered');
    })) ||
    (order?.trackingActivities && order.trackingActivities.some(a => {
      const s = a.status?.toLowerCase() || '';
      return s === 'delivered' || s === 'delivery_update' || s.includes('delivered');
    }));

  useEffect(() => {
    // 1. If we don't have an order (e.g. page refresh), fetch it from API
    if (!order && orderId) {
      const fetchOrder = async () => {
        try {
          const res = await authFetch(`/api/payment/orders/${orderId}`);
          const data = await res.json();
          if (data.success) {
            setOrder(data.data);
          }
        } catch (err) {
          console.error('Order fetch error:', err);
        }
      };
      fetchOrder();
    }
  }, [orderId]);

  useEffect(() => { 
    let intervalId;
    if (order?._id) {
      const syncTracking = async () => {
        // Skip sync if already delivered in DB to avoid unnecessary loading states
        if (order.trackingStatus?.toUpperCase() === 'DELIVERED') {
          setTrackingLoading(false);
          return;
        }

        setTrackingLoading(true);
        try {
          const res = await authFetch(`/api/payment/track/${order._id}`);
          const data = await res.json();
          if (data.success) {
            setTrackingData(data);
            if (data.trackingStatus) {
              setOrder(prev => ({ ...prev, trackingStatus: data.trackingStatus }));
            }
          }
        } catch (err) {
          console.error('Tracking fetch error:', err);
        } finally {
          setTrackingLoading(false);
        }
      };
      
      syncTracking();

      // Poll every 60s if not delivered
      if (order.trackingStatus?.toUpperCase() !== 'DELIVERED') {
        intervalId = setInterval(syncTracking, 60000);
      }
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [order?._id, order?.trackingStatus]); // Re-run if status changes to stop polling

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [item]);

  if ((!order || !item) && !trackingLoading) {
    return (
      <div className="od-error">
        <p>Order details not found.</p>
        <button onClick={() => navigate('/account/orders')}>Back to Orders</button>
      </div>
    );
  }

  // Fallback if loading and no data yet
  const showLoadingPlaceholder = trackingLoading && !trackingData && !isDelivered;

  const orderItems = order?.items || [];
  const activeItem = item || orderItems[0];

  if (!activeItem) return null;

  const otherItems = orderItems.filter(i => i.productId !== activeItem.productId || i.size !== activeItem.size);
  const itemPrice = parseFloat(String(activeItem.price).replace(/[₹$,]/g, '')) * activeItem.qty;

  const handleDownloadInvoice = () => {
    window.print();
  };

  return (
    <>
      <OrderInvoice order={order} />
      <div className="od-page">
        <div className="od-container">
          <div className="od-breadcrumb">
            <span onClick={() => navigate('/account/orders')}>My Orders</span>
            <span className="sep">›</span>
            <span className="current">Order Details</span>
          </div>

          <div className="od-grid">
            <div className="od-left">
              <div className="od-card main-prod-card">
                <div className="od-prod-header">
                  <div className="od-prod-main">
                    <div className="od-header-id">Order ID: #{order?.displayId}</div>
                    <h1>{activeItem.name}</h1>
                    <p className="od-prod-meta">{activeItem.color}, {activeItem.size}</p>
                    <p className="od-prod-seller">Seller: SUMATHI TRENDS</p>
                    <div className="od-prod-price">₹{itemPrice.toLocaleString()}</div>
                  </div>
                  <img src={activeItem.img || activeItem.photo} alt={activeItem.name} className="od-prod-img" />
                </div>
                <div className="od-timeline-wrap">
                  {showLoadingPlaceholder ? (
                    <div className="od-tracking-loading">Updating live tracking...</div>
                  ) : (
                    <SimplifiedTracker 
                      trackingData={trackingData || { activities: order.trackingActivities || [] }} 
                      orderDate={order?.createdAt} 
                      onSeeAll={() => setIsModalOpen(true)}
                    />
                  )}
                  {trackingLoading && trackingData && (
                    <div className="od-mini-updating">Updating...</div>
                  )}
                </div>
                {isDelivered && (
                  <div className="od-chat-section">
                    <button className="od-chat-btn" onClick={() => navigate('/support/order-help', { state: { order } })}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      Chat with us
                    </button>
                  </div>
                )}
              </div>
              {isDelivered && (
                <div className="od-card rate-card">
                  <h2>Rate your experience</h2>
                  <div className="od-rate-box">
                    <div className="od-rate-stars-row">
                      <StarRating value={rating} onChange={setRating} />
                      <button
                        className="od-write-review-btn"
                        onClick={() => navigate('/account/write-review', { state: { order, item, rating } })}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Write review
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {otherItems.length > 0 && (
                <div className="od-card others-card">
                  <h3>Other Items In This Order</h3>
                  <div className="od-others-divider" />
                  {otherItems.map((oi, idx) => (
                    <div
                      key={idx}
                      className="od-other-item"
                      onClick={() => { navigate(`/account/orders/${order.orderId}`, { state: { order, item: oi }, replace: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    >
                      <div className="od-other-item-name">{oi.name}</div>
                      <img src={oi.img || oi.photo} alt={oi.name} className="od-other-item-img" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="od-right">
              <div className="od-card info-card">
                <h2 className="od-section-title">DELIVERY DETAILS</h2>
                <div className="od-boxed-content">
                  <div className="od-info-row single-line">
                    <div className="od-info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    </div>
                    <div className="od-info-text">
                      <strong>Home:</strong> {(() => {
                        const full = [order.shippingAddress?.address, order.shippingAddress?.city, order.shippingAddress?.pincode].filter(Boolean).join(', ');
                        return full.length > 30 ? full.slice(0, 30) + '…' : full;
                      })()}
                    </div>
                  </div>
                  <div className="od-info-row-divider" />
                  <div className="od-info-row single-line">
                    <div className="od-info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <div className="od-info-text">
                      <strong>{order.shippingAddress?.name?.toUpperCase()}</strong>, {order.shippingAddress?.phone}
                    </div>
                  </div>
                </div>
              </div>
              <div className="od-card info-card price-details">
                <h2 className="od-section-title">PRICE DETAILS</h2>
                <div className="od-boxed-content">
                  <div className="od-price-row">
                    <span>Listing price</span>
                    <span>₹{itemPrice.toLocaleString()}</span>
                  </div>
                  <div className="od-price-row">
                    <span>Shipping</span>
                    <span className="od-free-shipping">FREE</span>
                  </div>
                  <div className="od-price-row">
                    <span>Estimated Tax (5%)</span>
                    <span>₹{(order.amount * 0.05).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="od-price-total">
                    <span>Total Amount</span>
                    <span>₹{order.amount?.toLocaleString()}</span>
                  </div>
                  <div className="od-payment-row">
                    <span>Payment method</span>
                    <span className="od-pay-val">{order.paymentMethod || 'Card Payment'}</span>
                  </div>
                </div>
                <button className="od-download-btn" onClick={handleDownloadInvoice}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TrackingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trackingData={trackingData || { activities: order.trackingActivities || [] }}
        orderDate={order?.createdAt}
      />
    </>
  );
}