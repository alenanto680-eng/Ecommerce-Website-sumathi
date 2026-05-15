import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/reviewmanagement.css';

const API = '/api/qr-reviews';
const REVIEW_URL = `${window.location.origin}/review`;

const authHeaders = () => ({
  'Content-Type': 'application/json',
});

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API}/admin`, { 
        headers: authHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) setReviews(data.data);
    } catch { flash('Failed to load reviews.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API}/admin/${id}/approve`, { 
        method: 'PATCH', 
        headers: authHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) setReviews(r => r.map(x => x._id === id ? { ...x, status: 'approved' } : x));
    } catch { flash('Server error.', 'error'); }
  };

  const handleUnapprove = async (id) => {
    try {
      const res = await fetch(`${API}/admin/${id}/unapprove`, { 
        method: 'PATCH', 
        headers: authHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) setReviews(r => r.map(x => x._id === id ? { ...x, status: 'pending' } : x));
    } catch { flash('Server error.', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this review?')) return;
    try {
      const res = await fetch(`${API}/admin/${id}`, { 
        method: 'DELETE', 
        headers: authHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) setReviews(r => r.filter(x => x._id !== id));
    } catch { flash('Server error.', 'error'); }
  };

  const filtered = filter === 'all'
    ? reviews
    : reviews.filter(r => r.status === filter);

  const counts = {
    all: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="rm-page">
      <h1 className="rm-title">Review Management</h1>

      {/* ── 4 stat cards in a row ── */}
      <div className="rm-stats-row">

        <div className="rm-stat-card rm-stat-total">
          <div className="rm-stat-num">{counts.all}</div>
          <div className="rm-stat-label">Total Reviews</div>
        </div>

        <div className="rm-stat-card rm-stat-pending">
          <div className="rm-stat-num">{counts.pending}</div>
          <div className="rm-stat-label">Pending</div>
        </div>

        <div className="rm-stat-card rm-stat-approved">
          <div className="rm-stat-num">{counts.approved}</div>
          <div className="rm-stat-label">Approved</div>
        </div>

        {/* QR card */}
        <div className="rm-stat-card rm-stat-qr">
          <button className="rm-qr-open-btn" onClick={() => navigate('/admin/review-qr')}>
            View QR
          </button>
        </div>

      </div>

      {/* ── Flash message ── */}
      {msg.text && (
        <div className={`rm-msg ${msg.type === 'error' ? 'rm-msg-error' : 'rm-msg-success'}`}>
          {msg.text}
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="rm-filters">
        {['all', 'pending', 'approved'].map(f => (
          <button
            key={f}
            className={`rm-filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* ── Reviews table ── */}
      <div className="rm-table-outer">
        {loading ? (
          <p className="rm-empty">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="rm-empty">No reviews found.</p>
        ) : (
          <table className="rm-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>NAME</th>
                <th>RATING</th>
                <th>REVIEW</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r._id}>
                  <td className="rm-date">{formatDate(r.createdAt)}</td>
                  <td className="rm-name">{r.name}</td>
                  <td className="rm-rating">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                  <td className="rm-message">
                    <p>{r.message}</p>
                    {(r.images?.length > 0 || r.video) && (
                      <div className="rm-media-mini-grid" style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        {r.images?.map((img, i) => (
                          <img key={i} src={img} alt="" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                        ))}
                        {r.video && <div style={{ width: '30px', height: '30px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>📹</div>}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`rm-status-badge ${r.status}`}>
                      {r.status === 'approved' ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="rm-actions">
                    {r.status === 'pending' ? (
                      <button className="rm-img-btn" onClick={() => handleApprove(r._id)} title="Approve">
                        <img src="/images/Review/approve.png" alt="Approve" />
                      </button>
                    ) : (
                      <button className="rm-img-btn" onClick={() => handleUnapprove(r._id)} title="Unapprove">
                        <img src="/images/Review/unapprove.png" alt="Unapprove" />
                      </button>
                    )}
                    <button className="rm-img-btn" onClick={() => handleDelete(r._id)} title="Delete">
                      <img src="/images/Review/delete.png" alt="Delete" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}