import { useState, useEffect } from 'react';
import '../assets/AdminLayout.css';
import '../assets/contactmessage.css';
import '../assets/supportmanagement.css';

export default function SupportManagement() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/support/admin/issues');
      const data = await res.json();
      if (data.success) setIssues(data.data);
    } catch (err) {
      console.error('Fetch issues error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/support/admin/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => prev.map(iss => iss._id === id ? { ...iss, status: data.data.status } : iss));
        if (selected && selected._id === id) setSelected({ ...selected, status: data.data.status });
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

  return (
    <div className="contact-page">
      <h1 className="contact-title"> Support Management ({issues.length})</h1>

      {loading ? (
        <div className="contact-outer">
          <p className="contact-empty">Loading...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="contact-outer empty">
          <p className="contact-empty">No support issues reported yet.</p>
        </div>
      ) : (
        <div className="contact-outer">
          <div className="contact-card">
            <table className="contact-table">
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>CUSTOMER</th>
                  <th>DESCRIPTION</th>
                  <th>STATUS</th>
                  <th>SUBMITTED</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(iss => (
                  <tr key={iss._id}>
                    <td className="bold" style={{ color: '#2D3E50', fontWeight: '700' }}>#{iss.orderId}</td>
                    <td className="td-name">{iss.officialCustomerId || 'N/A'}</td>
                    <td className="td-msg">{iss.description.slice(0, 50)}...</td>
                    <td>
                      <span className={`support-status-badge status-${iss.status.toLowerCase().replace(' ', '-')}`}>
                        {iss.status}
                      </span>
                    </td>
                    <td>{formatDate(iss.createdAt)}</td>
                    <td className="td-action">
                      <button className="btn-view" onClick={() => setSelected(iss)}>Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <h3 className="modal-title">Issue Details: #{selected.orderId}</h3>
            <hr className="modal-divider" />

            <div className="modal-fields" style={{ marginBottom: '25px' }}>
              <p style={{ marginBottom: '10px' }}><strong>Current Status:</strong>
                <select
                  className="admin-select"
                  style={{ marginLeft: '10px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }}
                  value={selected.status}
                  onChange={(e) => updateStatus(selected._id, e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </p>
              <p style={{ marginBottom: '10px' }}><strong>Customer ID:</strong> {selected.officialCustomerId}</p>
              <p><strong>Date Submitted:</strong> {new Date(selected.createdAt).toLocaleString('en-IN')}</p>
            </div>

            <div className="modal-msg-section" style={{ marginBottom: '25px' }}>
              <h4>Problem Description</h4>
              <div className="issue-description-well">{selected.description}</div>
            </div>

            {/* NEW: Product Context from the Order */}
            {selected.orderContext && (
              <div className="modal-msg-section" style={{ marginBottom: '25px' }}>
                <h4>Ordered Products</h4>
                <div className="order-context-list" style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {selected.orderContext.items?.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: idx < selected.orderContext.items.length -1 ? '1px dotted #cbd5e1' : 'none' }}>
                       <span style={{ fontSize: '14px', fontWeight: '600' }}>{it.name} <small style={{ color: '#64748b', fontWeight: '400' }}>({it.size})</small></span>
                       <span style={{ fontSize: '14px', color: '#1e293b' }}>Qty: {it.qty}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                    <span>Total Order Amount:</span>
                    <span style={{ color: '#10b981' }}>₹{selected.orderContext.amount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {selected.attachments?.length > 0 && (
              <div className="modal-msg-section">
                <h4>Evidence (Photos/Videos)</h4>
                <div className="attachment-preview-grid">
                  {selected.attachments.map((att, i) => (
                    <div key={i} className="attachment-preview-item">
                      {att.fileType === 'video' ? (
                        <video src={att.url} controls className="admin-prev-media" />
                      ) : (
                        <img src={att.url} alt="Evidence" className="admin-prev-media" onClick={() => window.open(att.url, '_blank')} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
