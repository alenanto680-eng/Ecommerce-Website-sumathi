// client/src/admin/views/ClientManagement.jsx

import { useState, useEffect, useCallback } from 'react';
import '../assets/ClientManagement.css';

const API = '/api/admin/clients';

/* ── helpers ── */
const ago = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/* Login badge — shows all methods this customer has used */
const LoginBadge = ({ types }) => {
  const all = Array.isArray(types) ? types : (types ? [types] : []);
  return (
    <span className="cm-badge-wrap">
      {all.includes('google') && <span className="cm-badge cm-badge-google">Google</span>}
      {all.includes('phone') && <span className="cm-badge cm-badge-phone">Phone</span>}
      {all.length >= 2 && <span className="cm-badge cm-badge-linked">Linked</span>}
    </span>
  );
};

/* ════════════════════════════════════
   CLIENT DETAIL DRAWER
   ════════════════════════════════════ */
function ClientDrawer({ client, onClose }) {
  const [tab, setTab] = useState('info');
  const [lightbox, setLightbox] = useState(null); // { type: 'img'|'vid', url: string }
  if (!client) return null;

  const TABS = ['info', 'addresses', 'orders', 'reviews'];

  return (
    <div className="cm-overlay" onClick={onClose}>
      <aside className="cm-drawer" onClick={(e) => e.stopPropagation()}>

        <button className="cm-drawer-close" onClick={onClose}>✕</button>

        {/* Head */}
        <div className="cm-drawer-head">
          <div className="cm-drawer-avatar">
            {client.photo
              ? <img src={client.photo} alt={client.name} />
              : <span>{(client.name || '?')[0].toUpperCase()}</span>}
          </div>
          <div>
            <h2>{client.name || 'Unknown'}</h2>
            {client.customerId && (
              <div className="cm-customer-id">{client.customerId}</div>
            )}
            <div className="cm-drawer-meta">
              <LoginBadge types={client.loginTypes || client.loginType} />
              <span className="cm-drawer-seen">Last seen {ago(client.lastSeen)}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="cm-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`cm-tab${tab === t ? ' cm-tab-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="cm-drawer-body">

          {/* INFO */}
          {tab === 'info' && (
            <div className="cm-info-list">
              <InfoRow label="Customer ID" value={client.customerId || '—'} />
              <InfoRow label="Name" value={client.name || '—'} />
              <InfoRow label="Email" value={client.email || '—'} />
              <InfoRow label="Phone" value={client.phone || '—'} />
              <InfoRow label="Login via" value={(client.loginTypes || [client.loginType]).join(' + ')} />
              <InfoRow label="Joined" value={client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-IN') : '—'} />
              <InfoRow label="Last seen" value={client.lastSeen ? new Date(client.lastSeen).toLocaleString('en-IN') : '—'} />
              {client.uids?.length > 1 && (
                <InfoRow label="Linked UIDs" value={`${client.uids.length} providers`} />
              )}
            </div>
          )}

          {/* ADDRESSES */}
          {tab === 'addresses' && (
            client.addresses?.length
              ? client.addresses.map((a, i) => (
                <div className="cm-addr-card" key={i}>
                  <span className="cm-addr-type">{a.type || 'Address'}</span>
                  <p className="cm-addr-name">{a.fullName} · {a.mobile}</p>
                  <p className="cm-addr-line">{a.address}, {a.locality}, {a.city} – {a.pincode}</p>
                  <p className="cm-addr-line">{a.state}{a.landmark ? ` · Near ${a.landmark}` : ''}</p>
                </div>
              ))
              : <EmptyState text="No saved addresses" />
          )}

          {/* ORDERS */}
          {tab === 'orders' && (
            client.orders?.length
              ? client.orders.map((o, i) => (
                <div className="cm-order-card" key={i}>
                  <div className="cm-order-head">
                    <span className="cm-order-id">#{o.orderId || `ORD-${i + 1}`}</span>
                    <span className={`cm-order-status cm-status-${o.status}`}>{o.status}</span>
                    <span className="cm-order-date">
                      {o.placedAt ? new Date(o.placedAt).toLocaleDateString('en-IN') : ''}
                    </span>
                  </div>
                  {o.items?.map((it, j) => (
                    <div className="cm-order-item" key={j}>
                      <span>{it.name}</span>
                      <span>×{it.qty} · ₹{(Number(it.price) * it.qty).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="cm-order-total">
                    Total: ₹{Number(o.total).toLocaleString('en-IN')}
                  </div>
                </div>
              ))
              : <EmptyState text="No orders placed yet" />
          )}

          {/* REVIEWS */}
          {tab === 'reviews' && (
            client.reviews?.length
              ? client.reviews.map((r, i) => (
                <div className="cm-order-card" key={i}>
                  <div className="cm-order-head">
                    <span className="cm-order-id" style={{ color: '#E8A020' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    <span className="cm-order-date">{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#334155', marginTop: '8px', lineHeight: '1.6' }}>
                    {r.message}
                  </div>
                  {(r.images?.length > 0 || r.video) && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {r.images?.map((img, j) => (
                        <div
                          key={j}
                          onClick={() => setLightbox({ type: 'img', url: img })}
                          style={{
                            width: '56px', height: '56px', borderRadius: '8px',
                            overflow: 'hidden', border: '1px solid #eee',
                            cursor: 'pointer', flexShrink: 0,
                          }}
                        >
                          <img src={img} alt="review" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                      {r.video && (
                        <div
                          onClick={() => setLightbox({ type: 'vid', url: r.video })}
                          style={{
                            width: '56px', height: '56px', background: '#1a1a2e',
                            borderRadius: '8px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '22px', cursor: 'pointer',
                            border: '1px solid #eee', flexShrink: 0,
                          }}
                        >▶</div>
                      )}
                    </div>
                  )}
                </div>
              ))
              : <EmptyState text="No reviews submitted yet" />
          )}

        </div>
      </aside>

      {/* Floating Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setLightbox(null)}
              style={{
                position: 'absolute', top: '-36px', right: '-8px',
                background: 'none', border: 'none', color: '#fff',
                fontSize: '28px', cursor: 'pointer', lineHeight: 1,
              }}
            >✕</button>
            {lightbox.type === 'img' ? (
              <img
                src={lightbox.url}
                alt="Review media"
                style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '10px', display: 'block', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
              />
            ) : (
              <video
                src={lightbox.url}
                controls
                autoPlay
                style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '10px', display: 'block', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const InfoRow = ({ label, value }) => (
  <div className="cm-info-row">
    <span className="cm-info-label">{label}</span>
    <span className="cm-info-value">{value}</span>
  </div>
);
const EmptyState = ({ text }) => <div className="cm-empty">{text}</div>;

/* ════════════════════════════════════
   STAT CARD
   ════════════════════════════════════ */
function StatCard({ label, value, color }) {
  return (
    <div className={`cm-stat-card cm-stat-${color}`}>
      <span className="cm-stat-label">{label}</span>
      <span className="cm-stat-value">{value ?? '—'}</span>
    </div>
  );
}

/* ════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════ */
export default function ClientManagement() {
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const LIMIT = 20;


  /* auth helper */
  const authHeaders = () => ({
    'Content-Type': 'application/json',
  });

  /* fetch stats */
  const fetchStats = useCallback(() => {
    fetch(`${API}/stats`, { 
      headers: authHeaders(),
      credentials: 'include'
    })
      .then(r => r.json())
      .then(d => d.success && setStats(d.stats))
      .catch(() => { });
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  /* fetch client list */
  const fetchClients = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ loginType: filter, search, dateFilter, page, limit: LIMIT });
    fetch(`${API}?${params}`, { 
      headers: authHeaders(),
      credentials: 'include'
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) { setClients(d.users); setTotal(d.total); }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [filter, search, dateFilter, page]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  /* open detail drawer */
  const openClient = async (c) => {
    try {
      const r = await fetch(`${API}/${c._id}`, { 
        headers: authHeaders(),
        credentials: 'include'
      });
      const d = await r.json();
      setSelected(d.success ? d.user : c);
    } catch {
      setSelected(c);
    }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="cm-page">

      {/* Header */}
      <h1 className="cm-title">Client Management</h1>

      {/* Stats */}
      {stats && (
        <div className="cm-stats-row">
          <StatCard label="Total Clients" value={stats.total} color="blue" />
          <StatCard label="Google Logins" value={stats.google} color="red" />
          <StatCard label="Phone Logins" value={stats.phone} color="green" />
          <StatCard label="New Today" value={stats.newToday} color="purple" />
        </div>
      )}

      {/* Toolbar */}
      <div className="cm-toolbar">
        <div className="cm-filter-tabs">
          {['all', 'google', 'phone'].map(f => (
            <button
              key={f}
              className={`cm-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => { setFilter(f); setPage(1); }}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="cm-search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="cm-search-input"
            placeholder="Search name, email, phone or CUST-ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select className="cm-date-filter" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }}>
          <option value="all">Join Date: All Time</option>
          <option value="joined-today">Joined Today</option>
          <option value="joined-week">Joined This Week</option>
          <option value="joined-month">Joined This Month</option>
        </select>
      </div>

      {/* Table */}
      <div className="cm-table-wrap">
        {loading ? (
          <div className="cm-loading">Loading clients…</div>
        ) : clients.length === 0 ? (
          <div className="cm-loading">No clients found.</div>
        ) : (
          <table className="cm-table">
            <thead>
              <tr>
                <th>Client</th>
                <th className="cm-th-id">ID</th>
                <th>Contact</th>
                <th className="cm-th-login">Login</th>
                <th className="cm-th-orders">Orders</th>
                <th className="cm-th-seen">Last Seen</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c._id} className="cm-row" onClick={() => openClient(c)}>

                  <td>
                    <div className="cm-client-cell">
                      <div className="cm-avatar">
                        {c.photo
                          ? <img src={c.photo} alt={c.name} />
                          : <span>{(c.name || '?')[0].toUpperCase()}</span>}
                      </div>
                      <span className="cm-client-name">{c.name || '—'}</span>
                    </div>
                  </td>

                  <td className="cm-td-id">
                    <span className="cm-custid">{c.customerId || '—'}</span>
                  </td>

                  <td className="cm-td-contact">
                    <span>{c.email || c.phone || '—'}</span>
                    {c.email && c.phone && <span className="cm-contact-sub">{c.phone}</span>}
                  </td>

                  <td className="cm-td-login">
                    <LoginBadge types={c.loginTypes || c.loginType} />
                  </td>

                  <td className="cm-td-orders"><span className="cm-pill">{c.orderCount || 0}</span></td>

                  <td className="cm-td-seen">{ago(c.lastSeen)}</td>

                  <td>
                    <button
                      className="cm-view-btn"
                      onClick={(e) => { e.stopPropagation(); openClient(c); }}
                    >
                      View
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="cm-pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >← Prev</button>
          <span>Page {page} of {pages} ({total} total)</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
          >Next →</button>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && <ClientDrawer client={selected} onClose={() => setSelected(null)} />}

    </div>
  );
}