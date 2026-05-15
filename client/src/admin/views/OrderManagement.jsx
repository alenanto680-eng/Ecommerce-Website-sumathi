import { useState, useEffect, useRef } from 'react';
import { Download, Search, RefreshCw, CheckCircle, Package, Truck, Home, Eye, X, User, MapPin, ShoppingBag, Printer } from 'lucide-react';
import '../assets/OrderManagement.css';

const API = '/api/payment/orders';
const authHeaders = () => ({
  'Content-Type': 'application/json',
});

// Status Mapping Helper for all components
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

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // Empty by default to show 'All'
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const selectedOrder = orders.find(o => o._id === selectedOrderId);

  const fetchOrders = async () => {
    try {
      const res = await fetch(API, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => {
          const newOrders = data.data.filter(o => o.status === 'success');
          return newOrders.map(no => {
            const existing = prev.find(p => p._id === no._id);
            if (existing && existing.trackingPayload) {
              return { ...no, trackingPayload: existing.trackingPayload, trackingActivities: existing.trackingActivities };
            }
            return no;
          });
        });
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh the order list from our DB every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when an order is opened in the drawer
  useEffect(() => {
    if (selectedOrderId && selectedOrder && String(selectedOrder.trackingStatus || '').toUpperCase() !== 'DELIVERED') {
      handleSyncStatus(selectedOrderId);
    }
  }, [selectedOrderId]);

  // Keep a ref to orders to avoid stale closures in the interval
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // BACKGROUND SYNC: Automatically ask Shiprocket for updates every 60s for orders in progress
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const activeOrders = ordersRef.current.filter(o => 
        o.shiprocketShipmentId && 
        o.trackingStatus?.toUpperCase() !== 'DELIVERED' &&
        o.trackingStatus?.toUpperCase() !== 'CANCELED'
      );
      
      activeOrders.forEach(o => handleSyncStatus(o._id));
    }, 60000); // Check Shiprocket every 60 seconds

    return () => clearInterval(syncInterval);
  }, []);

  const handleSyncStatus = async (orderId) => {
    setSyncingId(orderId);
    try {
      const res = await fetch(`/api/payment/track/${orderId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { 
          ...o, 
          trackingStatus: data.trackingStatus, 
          trackingActivities: data.activities,
          trackingPayload: data // Store for drawer compatibility
        } : o));
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncingId(null);
    }
  };

  const handleManualSRSync = async (orderId) => {
    if (!window.confirm('Try pushing this order to Shiprocket now?')) return;
    setSyncingId(orderId);
    try {
      const res = await fetch(`/api/payment/manual-sync-sr/${orderId}`, { 
        method: 'POST',
        headers: authHeaders() 
      });
      const data = await res.json();
      if (data.success) {
        alert('Order successfully pushed to Shiprocket!');
        fetchOrders(); // Refresh table to show new status/link
      } else {
        alert('Shiprocket Error: ' + (data.error || 'Failed to sync'));
      }
    } catch (err) {
      console.error('Manual sync error:', err);
      alert('Network error while syncing');
    } finally {
      setSyncingId(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    const isSameDay = !selectedDate || o.createdAt?.split('T')[0] === selectedDate;
    const matchesSearch = o.displayId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && isSameDay;
  });

  if (loading) return <div className="om-page"><div className="no-orders-msg">Loading Orders...</div></div>;

  return (
    <div className="om-page">
      {/* Aligned Header */}
      <header className="om-header">
        <h1 className="om-title">Order Dashboard</h1>
        <div className="om-header-tools">
          <div className="om-search-box">
            <Search size={16} />
            <input
              placeholder="Search Display ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="om-date-filter" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            {selectedDate && (
              <button 
                onClick={() => setSelectedDate('')}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
              >
                CLEAR
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="om-content">
        <div className="om-table-wrap">
          <table className="om-table">
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>CLIENT</th>
                <th>AMOUNT</th>
                <th>TRACKING</th>
                <th>DATE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => (
                <tr key={o._id} className="om-row" onClick={() => setSelectedOrderId(o._id)}>
                  <td>
                    <div className="om-id-cell">
                      <span className={`om-status-dot ${o.trackingStatus === 'DELIVERED' ? 'done' : 'active'}`} />
                      <strong>#{o.displayId}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="om-client-cell">
                      <span>{o.userName || 'Guest'}</span>
                      <span className="om-client-sub">{o.userEmail || o.user?.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="om-amount-cell">
                      <span className="om-amount">₹{o.amount.toLocaleString()}</span>
                      {o.giftWrapping && <span className="om-gift-tag">(Gift)</span>}
                    </div>
                  </td>
                  <td>
                    <div className="om-tracking-cell">
                      {(() => {
                        const acts = o.trackingActivities || o.trackingPayload?.activities || [];
                        const validActs = acts.filter(a => {
                          const s = a.status?.toLowerCase() || '';
                          return !s.includes('metadata') && !s.includes('tracking_id') && !s.includes('awb_code');
                        });
                        if (validActs.length > 0) {
                          const latest = validActs[0];
                          return (
                            <div className={`om-tracking-latest ${latest.status?.toLowerCase().includes('delivered') ? 'delivered' : ''}`}>
                              {formatStatus(latest.status)}
                              <span className="om-tracking-loc"> · {latest.location || 'In Transit'}</span>
                            </div>
                          );
                        }
                        return <span className="om-tracking-recent">Order Confirmed</span>;
                      })()}
                    </div>
                  </td>
                  <td className="om-date-cell">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="om-view-btn">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="no-orders-msg">No orders found matching your criteria.</div>
          )}
        </div>
      </div>

      {selectedOrderId && selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrderId(null)}
          onSync={() => handleSyncStatus(selectedOrderId)}
          syncing={syncingId === selectedOrderId}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════
   ORDER DETAIL DRAWER (LIKE CLIENT MGMT)
   ════════════════════════════════════ */
function OrderDrawer({ order, onClose, onSync, syncing }) {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${order.displayId}</title>
          <style>
             @page { size: A4; margin: 0; }
             body { font-family: 'Inter', sans-serif; margin: 0; padding: 15mm; color: #1e293b; font-size: 11px; }
             .print-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; width: 100%; box-sizing: border-box; background: #fff; }
             .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
             .p-id-grp { display: flex; flex-direction: column; }
             .p-id-lab { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; }
             .p-id-val { font-size: 16px; font-weight: 800; margin-top: 2px; }
             .p-paid-sect { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
             .p-paid { border: 2px solid #166534; color: #166534; padding: 4px 12px; border-radius: 4px; font-weight: 800; font-size: 11px; text-transform: uppercase; display: inline-block; }
             .p-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
             .p-sect h4 { font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 8px; }
             .p-info { font-size: 11px; line-height: 1.4; color: #334155; }
             .p-prod-list { margin-top: 15px; }
             .p-prod-item { display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
             .p-total-box { margin-top: 20px; display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
             .p-total-row { display: flex; justify-content: space-between; width: 200px; font-size: 11px; }
             .p-total-final { border-top: 2px solid #1e293b; padding-top: 5px; margin-top: 5px; font-weight: 800; font-size: 14px; }
          </style>
        </head>
        <body onload="window.print();window.close()">
           <div class="print-card">
              <div class="p-header">
                <div class="p-id-grp">
                   <span class="p-id-lab">Digital Invoice</span>
                   <span class="p-id-val">#${order.displayId}</span>
                </div>
                <div class="p-paid-sect">
                  <span class="p-paid">PAID IN FULL</span>
                  <span style="color: #64748b; font-size: 9px; font-weight: 600; margin-top: 8px; display: block;">Date: ${new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div class="p-grid">
                 <div class="p-sect">
                    <h4>BILL TO</h4>
                    <div class="p-info">
                       <strong>${order.userName || 'Guest'}</strong><br/>
                       ${order.userEmail || 'Customer Email N/A'}
                    </div>
                 </div>
                 <div class="p-sect">
                    <h4>SHIP TO</h4>
                    <div class="p-info">
                       <strong>${order.shippingAddress?.name || 'Customer'}</strong><br/>
                       ${order.shippingAddress?.street || order.shippingAddress?.address || ''}<br/>
                       ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}<br/>
                       <strong>PH: ${order.shippingAddress?.phone}</strong>
                    </div>
                 </div>
              </div>
              <div class="p-prod-list">
                 <h4 style="font-size: 10px; color: #94A3B8; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9;">ITEMS AND DESCRIPTION</h4>
                 ${order.items.map(it => `
                   <div class="p-prod-item">
                      <span><strong>${it.name}</strong><br/><small>${it.size ? 'Size: '+it.size : ''}</small></span>
                      <span style="text-align: center">Qty: ${it.qty}</span>
                      <span style="text-align: right">₹${it.price.toLocaleString()}</span>
                   </div>
                 `).join('')}
              </div>
              <div class="p-total-box">
                <div class="p-total-row"><span>Sub Total (Excl. Tax)</span><span>₹${((order.amount - (order.giftWrapping ? 50 : 0)) / 1.05).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                <div class="p-total-row"><span>CGST (2.5%)</span><span>₹${(((order.amount - (order.giftWrapping ? 50 : 0)) - ((order.amount - (order.giftWrapping ? 50 : 0)) / 1.05)) / 2).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                <div class="p-total-row"><span>SGST (2.5%)</span><span>₹${(((order.amount - (order.giftWrapping ? 50 : 0)) - ((order.amount - (order.giftWrapping ? 50 : 0)) / 1.05)) / 2).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                ${order.giftWrapping ? `<div class="p-total-row"><span>Gift Wrapping</span><span>₹50.00</span></div>` : ''}
                <div class="p-total-row p-total-final"><span>Total Amount</span><span>₹${order.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
              </div>
              <div style="margin-top: 40px; text-align: center; font-size: 9px; color: #94A3B8;">
                Thank you for shopping with Sumathi Trends!<br/>
                For any support, please contact us at sumathitrends.in@gmail.com
              </div>
           </div>
           </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="om-drawer-overlay" onClick={onClose}>
      <aside className="om-drawer" onClick={e => e.stopPropagation()}>
        <button className="om-drawer-close" onClick={onClose}><X size={20} /></button>

        <div className="om-drawer-head">
          <div className="om-drawer-id">ORDER #{order.displayId}</div>
        </div>

        <div className="om-drawer-body" ref={printRef}>
          {/* 1. Products Section */}
          <div className="om-drawer-section">
            <h4 className="om-sect-title"><ShoppingBag size={16} /> Products ({order.items?.length})</h4>
            <div className="om-prod-list">
              {order.items?.map((it, idx) => (
                <div key={idx} className="om-prod-item">
                  <span className="om-p-name">{it.name}</span>
                  <span className="om-p-meta">x{it.qty} · ₹{it.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Address Section */}
          <div className="om-drawer-section">
            <h4 className="om-sect-title"><MapPin size={16} /> Shipping Address</h4>
            <div className="om-info-card address">
              {order.shippingAddress ? (
                <>
                  <p><strong>{order.shippingAddress.name}</strong></p>
                  <p>{order.shippingAddress.street || order.shippingAddress.address}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                  <p className="om-ph-row">PH: {order.shippingAddress.phone}</p>
                </>
              ) : <p>No address info.</p>}
            </div>
          </div>

          {/* 3. Client Section */}
          <div className="om-drawer-section">
            <h4 className="om-sect-title"><User size={16} /> Customer Info</h4>
            <div className="om-info-card">
              <p><strong>Name:</strong> {order.userName || 'Guest'}</p>
              <p><strong>Email:</strong> {order.userEmail || order.user?.email || 'N/A'}</p>
            </div>
          </div>

          {/* 4. Tracking Section (Last) */}
          <div className="om-drawer-section">
            <h4 className="om-sect-title"><Truck size={16} /> Live Tracking</h4>
            <ShiprocketActivityTracker 
              activities={order.trackingPayload?.activities || order.trackingActivities || []} 
              isSyncing={syncing}
            />
          </div>
        </div>

        <div className="om-drawer-footer">
          <button className="om-print-btn" onClick={handlePrint}>
            <Printer size={16} /> Print
          </button>
        </div>
      </aside>
    </div>
  );
}

function ShiprocketActivityTracker({ activities: rawActivities, isSyncing }) {
  // 1. Filter internal metadata
  const activities = (rawActivities || []).filter(a => {
    const s = a.status?.toLowerCase() || '';
    return !s.includes('metadata') && !s.includes('tracking_id') && !s.includes('awb_code');
  });


  if (activities.length === 0) {
    return (
      <div className="om-tracking-pending">
        {isSyncing ? (
          <div className="om-sync-loader">
             <div className="om-sync-spinner" />
             <span>Updating tracking...</span>
          </div>
        ) : 'No tracking scans yet'}
      </div>
    );
  }

  const getDay = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' });
  const getTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

  return (
    <div className="shiprocket-tracker">
      {activities.map((a, i) => (
        <div key={i} className={`sr-step ${a.status?.toLowerCase().includes('delivered') ? 'delivered' : ''}`}>
          <div className="sr-dot-line">
            <div className="sr-dot" />
            {i < activities.length - 1 && <div className="sr-line" />}
          </div>
          <div className="sr-info">
            <div className="sr-label-row">
              <span className="sr-status">{formatStatus(a.status)}</span>
              <span className="sr-date">{getDay(a.date)}</span>
            </div>
            <p className="sr-activity">{a.activity || (a.status?.toLowerCase().includes('delivered') ? 'Order successfully delivered.' : '')}</p>
            <p className="sr-meta">
              {getDay(a.date)} - {getTime(a.date)}
              {a.location && <span> · {a.location}</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
