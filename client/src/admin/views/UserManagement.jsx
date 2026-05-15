import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/usermanagement.css';

const API = '/api/users';
const authHeaders = () => ({
  'Content-Type': 'application/json',
});

const PAGE_OPTIONS = [
  'Contact Messages',
  'Review Management',
  'Product Management',
  'Client Management',
  'Payment Management',
  'Order Management',
  'Support Management'
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', permissions: [] });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalPerms, setModalPerms] = useState([]);

  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const res = await fetch(API, { 
        headers: authHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        const sorted = [...data.data].sort((a, b) => {
          if (a.role === 'superadmin') return -1;
          if (b.role === 'superadmin') return 1;
          return 0;
        });
        setUsers(sorted);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 5000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const { password } = form;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#%&*!^$])[A-Za-z\d@#%&*!^$]{8,}$/;
    if (!passwordRegex.test(password)) {
      flash('Password must be at least 8 characters long and include a capital letter, a number, and a special character.', 'error');
      return;
    }

    try {
      const res = await fetch(API, { 
        method: 'POST', 
        headers: authHeaders(), 
        credentials: 'include',
        body: JSON.stringify(form) 
      });
      const data = await res.json();
      if (data.success) {
        setUsers(u => {
          const newList = [data.data, ...u];
          return newList.sort((a, b) => a.role === 'superadmin' ? -1 : b.role === 'superadmin' ? 1 : 0);
        });
        setForm({ username: '', password: '', permissions: [] });
        flash('Admin user created successfully.');
      } else { flash(data.message, 'error'); }
    } catch { flash('Server error.', 'error'); }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await fetch(`${API}/${id}/toggle`, { 
        method: 'PATCH', 
        headers: authHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) setUsers(u => u.map(x => x._id === id ? { ...x, isActive: data.isActive } : x));
    } catch { flash('Server error.', 'error'); }
  };

  const openPermissionModal = (user) => {
    setSelectedUser(user);
    setModalPerms(user.permissions || []);
    setModalOpen(true);
  };

  const toggleModalPermission = (perm) => {
    setModalPerms(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API}/${selectedUser._id}/permissions`, {
        method: 'PATCH',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ permissions: modalPerms })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(u => u.map(x => x._id === selectedUser._id ? { ...x, permissions: modalPerms } : x));
        setModalOpen(false);
        flash('Permissions updated successfully.');
      } else { flash(data.message, 'error'); }
    } catch { flash('Server error.', 'error'); }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"?`)) return;
    try {
      const res = await fetch(`${API}/${id}`, { 
        method: 'DELETE', 
        headers: authHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) { setUsers(u => u.filter(x => x._id !== id)); flash('User deleted.'); }
    } catch { flash('Server error.', 'error'); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString('en-GB'),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  return (
    <div className="um-page">
      <h1 className="um-title">User Management</h1>

      <div className="um-card">
        <h3 className="um-card-title">Create New Admin User</h3>
        <p className="um-card-sub">Set credentials for new team members.</p>
        
        {msg.text && <div className={`um-msg ${msg.type === 'error' ? 'um-msg-error' : 'um-msg-success'}`}>{msg.text}</div>}
        
        <form className="um-form" onSubmit={handleCreate}>
          <div className="um-form-row">
            <div className="um-form-group">
              <label>Username:</label>
              <input type="text" placeholder="Enter username" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
            </div>
            <div className="um-form-group">
              <label>Password:</label>
              <div className="um-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Strong password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button type="button" className="um-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>
          <button type="submit" className="um-create-btn">Create Admin Account</button>
        </form>
      </div>

      <h2 className="um-section-title">Existing Admin Users</h2>
      <div className="um-table-outer">
        {loading ? <p className="um-empty">Loading...</p> : (
          <table className="um-table">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Admin User</th>
                <th style={{ width: '15%' }}>Role</th>
                <th style={{ width: '20%' }}>Last Login</th>
                <th style={{ width: '25%' }}>Page Access</th>
                <th style={{ width: '20%' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const login = formatDate(u.lastLogin);
                return (
                  <tr key={u._id}>
                    <td><div className="um-username">{u.username}</div></td>
                    <td><span className={`um-role-badge ${u.role}`}>{u.role}</span></td>
                    <td>
                        {login ? (
                            <div className="um-last-login">
                                <span className="um-login-date">{login.date}</span>
                                <span className="um-login-time">{login.time}</span>
                            </div>
                        ) : (
                            <span className="um-login-never">Never logged in</span>
                        )}
                    </td>
                    <td>
                        {u.role !== 'superadmin' ? (
                            <button className="um-access-btn" onClick={() => openPermissionModal(u)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                </svg>
                                Page Access
                            </button>
                        ) : (
                            <span className="um-protected">Full Access</span>
                        )}
                    </td>
                    <td>
                      <div className="um-actions">
                        {u.role === 'superadmin' ? (
                          <>
                            <button className="um-img-btn" onClick={() => navigate('/admin/change-username')} title="Change Username">
                              <img src="/images/usermanagement/Username.png" alt="Change Username" />
                            </button>
                            <button className="um-img-btn" onClick={() => navigate('/admin/change-password')} title="Change Password">
                              <img src="/images/usermanagement/Password.png" alt="Change Password" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="um-img-btn" onClick={() => handleToggleActive(u._id)} title={u.isActive ? 'Deactivate' : 'Activate'}>
                              <img src={u.isActive ? '/images/usermanagement/Activate.png' : '/images/usermanagement/Deactivate.png'} alt={u.isActive ? 'Deactivate' : 'Activate'} />
                            </button>
                            <button className="um-img-btn" onClick={() => handleDelete(u._id, u.username)} title="Delete">
                              <img src="/images/usermanagement/Delete.png" alt="Delete" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* PERMISSION MODAL */}
      {modalOpen && (
        <div className="um-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="um-modal-box" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
                <div>
                    <h3 className="um-modal-title">Edit Page Access</h3>
                    <div className="um-modal-subtitle">User: <strong>{selectedUser?.username}</strong></div>
                </div>
                <button className="um-modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>

            <div className="um-modal-body">
                <div className="um-modal-perms-grid">
                    {PAGE_OPTIONS.map(opt => (
                        <label key={opt} className="um-modal-checkbox">
                            <input 
                                type="checkbox" 
                                checked={modalPerms.includes(opt)}
                                onChange={() => toggleModalPermission(opt)}
                            />
                            <span>{opt}</span>
                        </label>
                    ))}
                </div>

                <div className="um-modal-summary">
                    <span className="um-summary-label">Accessed Pages:</span>
                    <div className="um-accessed-tags">
                        {modalPerms.length === 0 ? (
                            <span className="um-tag-empty">No pages assigned</span>
                        ) : (
                            modalPerms.map(p => <span key={p} className="um-accessed-tag">{p}</span>)
                        )}
                    </div>
                </div>
            </div>

            <div className="um-modal-footer">
                <button className="um-btn-cancel-modal" onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="um-btn-save-modal" onClick={handleSavePermissions}>Save Access</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
