import React from 'react';
import '../../styles/myorders/OrderInvoice.css';

function OrderInvoice({ order }) {
  if (!order) return null;

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Calculation logic (5% Inclusive GST)
  const totalAmount = order.amount || 0;
  const taxableValue = (totalAmount / 1.05);
  const totalGst = totalAmount - taxableValue;
  const halfGst = totalGst / 2;

  return (
    <div className="invoice-container" id="printable-invoice">
      <div className="inv-header">
        <h1 className="inv-shop-name">Sumathi Trends</h1>
        <p className="inv-address">
          No.52, Saxena complex, Kodigehalli Main Rd,<br/>
          Defence Layout, Sahakar Nagar, Bengaluru, Karnataka 560092
        </p>
        <p className="inv-address">Phone: 87928 88508</p>
        <p className="inv-address"><strong>GSTIN: APPLIED</strong></p>
        <div className="inv-tax-title">Tax Invoice</div>
      </div>

      <div className="inv-meta-grid">
        <div className="inv-meta-left">
          <p><strong>Bill No:</strong> {order.displayId || order.id || order._id?.slice(-6).toUpperCase()}</p>
          <p><strong>Customer:</strong> {order.shippingAddress?.name?.toUpperCase() || 'VALUED CUSTOMER'}</p>
          <p><strong>Phone:</strong> {order.shippingAddress?.phone}</p>
        </div>
        <div className="inv-meta-right">
          <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
          <p><strong>Time:</strong> {formatTime(order.createdAt)}</p>
        </div>
      </div>

      <table className="inv-table">
        <thead>
          <tr>
            <th className="inv-col-sn">Sn</th>
            <th>Item Name</th>
            <th className="inv-col-qty">Qty</th>
            <th className="inv-col-rate">Order Value</th>
            <th className="inv-col-amt">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td><strong>{it.name.toUpperCase()}</strong> ({it.size})</td>
              <td>{it.qty}.00</td>
              <td>{parseFloat(it.price).toFixed(2)}</td>
              <td>{(parseFloat(it.price) * it.qty).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-summary">
        <div className="inv-summary-row">
          <span>Total Qty:</span>
          <span>{order.items.reduce((acc, it) => acc + (it.qty || 1), 0)}.00</span>
        </div>
        <div className="inv-summary-row">
          <span>Discount:</span>
          <span>0.00</span>
        </div>
        <div className="inv-summary-row inv-total-line">
          <span>Net Bill Amount:</span>
          <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="inv-payment-box">
        <div className="inv-payment-title">Payment Details</div>
        <div className="inv-summary-row">
          <span>Payment ID:</span>
          <span>{order.paymentId || 'PREPAID ONLINE'}</span>
        </div>
        <div className="inv-summary-row">
          <span>Payment Method:</span>
          <span>{order.paymentMethod || 'Razorpay (Online)'}</span>
        </div>
      </div>

      <div className="inv-gst-summary">
        <table className="gst-table">
          <thead>
            <tr>
              <th rowSpan={2}>Taxable Value</th>
              <th colSpan={2}>CGST</th>
              <th colSpan={2}>SGST</th>
              <th rowSpan={2}>Total GST</th>
            </tr>
            <tr>
              <th>%</th>
              <th>Amt</th>
              <th>%</th>
              <th>Amt</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{taxableValue.toFixed(2)}</td>
              <td>2.5</td>
              <td>{halfGst.toFixed(2)}</td>
              <td>2.5</td>
              <td>{halfGst.toFixed(2)}</td>
              <td>{totalGst.toFixed(2)}</td>
            </tr>
            <tr style={{fontWeight:'bold'}}>
              <td>{taxableValue.toFixed(2)}</td>
              <td></td>
              <td>{halfGst.toFixed(2)}</td>
              <td></td>
              <td>{halfGst.toFixed(2)}</td>
              <td>{totalGst.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="inv-footer-note">
        <p>Thank you for shopping with Sumathi Trends!</p>
        <p>This is a computer generated invoice.</p>
      </div>
    </div>
  );
}

export default OrderInvoice;
