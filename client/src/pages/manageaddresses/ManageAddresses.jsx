import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import '../../styles/manageaddresses/ManageAddresses.css';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { authFetch } from '../../utils/authFetch';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const emptyForm = {
  fullName: '', mobile: '', pincode: '', locality: '',
  address: '', city: '', state: '', landmark: '', altPhone: '', type: '', isDefault: false
};

/* ─────────────────────────────────────────────────────────────────
   Broadcast helper — called after every address mutation so that
   ProductInfo, AddressSidebar, and any cart page can react live.

   Any component that cares listens for:
     window.addEventListener('sumathi_addresses_changed', handler)
   and should also listen for the native 'storage' event for
   cross-tab sync.
───────────────────────────────────────────────────────────────── */
function broadcastAddressChange(updatedAddresses, deletedId = null) {
  window.dispatchEvent(
    new CustomEvent('sumathi_addresses_changed', {
      detail: { addresses: updatedAddresses, deletedId }
    })
  );
}

export default function ManageAddresses() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  const [activeNav, setActiveNav] = useState('account-settings');
  const [activeSubNav, setActiveSubNav] = useState('address');
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [addresses, setAddresses_] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userUid, setUserUid] = useState(null);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [locating, setLocating] = useState(false);
  const [validatingPin, setValidatingPin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserUid(user.uid);
        try {
          const res = await authFetch(`/api/client-auth/addresses/${user.uid}`);
          const data = await res.json();
          if (data.success) setAddresses_(data.addresses || []);
        } catch (err) {
          console.error("Failed to fetch addresses", err);
        }
      } else {
        setUserUid(null);
        try {
          const savedLocal = localStorage.getItem('sumathi_addresses');
          setAddresses_(savedLocal ? JSON.parse(savedLocal) : []);
        } catch { setAddresses_([]); }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="account-loading-wrapper">
        <div className="account-loading-spinner"></div>
        <p>Loading your Addresses...</p>
      </div>
    );
  }

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = '10-digit number required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = '6-digit pincode required';
    if (!form.locality.trim()) e.locality = 'Required';
    if (!form.address.trim()) e.address = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.state) e.state = 'Select a state';
    if (!form.type) e.type = 'Select address type';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    // Skip Shiprocket Pincode Check and save directly as requested
    setValidatingPin(false);

    const newAddrPart = {
      type: form.type.toUpperCase(),
      name: form.fullName, phone: form.mobile,
      line1: form.address,
      line2: `${form.locality}, ${form.city}, ${form.state} -`,
      pincode: form.pincode,
      landmark: form.landmark, altPhone: form.altPhone,
      isDefault: form.isDefault || false,
      fullName: form.fullName, mobile: form.mobile,
      locality: form.locality, address: form.address, city: form.city, state: form.state
    };

    let updatedAddresses = [];

    if (userUid) {
      if (editingId !== null) {
        const res = await authFetch(`/api/client-auth/addresses/${userUid}/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAddrPart)
        });
        const data = await res.json();
        if (data.success) {
          updatedAddresses = data.addresses;
          setAddresses_(updatedAddresses);

          // If this edited address is the active one, update it in localStorage too
          const KEYS_TO_SYNC = ['sumathi_active_address', 'sumathi_selected_address'];
          for (const k of KEYS_TO_SYNC) {
            try {
              const str = localStorage.getItem(k);
              if (str) {
                const active = JSON.parse(str);
                if (String(active.id || active._id) === String(editingId)) {
                  const updated = updatedAddresses.find(a => String(a.id || a._id) === String(editingId));
                  if (updated) localStorage.setItem(k, JSON.stringify(updated));
                }
              }
            } catch { }
          }
        }
      } else {
        const payload = { ...newAddrPart, id: Date.now().toString() };
        const res = await authFetch(`/api/client-auth/addresses/${userUid}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          updatedAddresses = data.addresses;
          setAddresses_(updatedAddresses);
        }
      }
    } else {
      // Guest local storage fallback
      let curr = addresses;
      if (newAddrPart.isDefault) curr = curr.map(a => ({ ...a, isDefault: false }));
      if (editingId !== null) {
        curr = curr.map(x => x.id === editingId ? { ...x, ...newAddrPart } : x);
      } else {
        curr = [...curr, { ...newAddrPart, id: Date.now().toString() }];
      }
      setAddresses_(curr);
      updatedAddresses = curr;
      try { localStorage.setItem('sumathi_addresses', JSON.stringify(curr)); } catch { }
    }

    broadcastAddressChange(updatedAddresses);

    // ── NEW: Force sync localStorage if a new default was set ──
    if (newAddrPart.isDefault) {
      const KEYS = ['sumathi_active_address', 'sumathi_selected_address'];
      KEYS.forEach(k => localStorage.removeItem(k));
    }

    // ─────────────────────────────────────────────────────────────────
    // AUTO-SYNC PERSONAL INFORMATION
    // ─────────────────────────────────────────────────────────────────
    if (userUid && updatedAddresses.length > 0) {
      try {
        const profileRes = await authFetch(`/api/client-auth/profile/${userUid}`);
        const profileData = await profileRes.json();

        if (profileData.success) {
          const u = profileData.user;
          const updates = {};
          const loginType = (u.loginTypes && u.loginTypes.length > 0) ? u.loginTypes[0] : '';

          // 1. Phone Login -> Sync Name if missing
          if (loginType === 'phone') {
            if (!u.name || u.name.trim() === '') {
              updates.name = newAddrPart.fullName;
            }
          }

          // 2. Google Login -> Sync Phone if missing
          if (loginType === 'google') {
            const currentPhone = (u.phone || '').trim();
            if (!currentPhone || currentPhone === '' || currentPhone === '+91') {
              updates.phone = `+91${newAddrPart.phone}`;
            }
          }

          if (Object.keys(updates).length > 0) {
            await authFetch(`/api/client-auth/profile/${userUid}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            });
          }
        }
      } catch (err) {
        console.warn("Failed to auto-sync profile info:", err);
      }
    }

    setForm(emptyForm);
    setErrors({});
    setEditingId(null);
    setSaved(true);
    setShowForm(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleEdit = (addr) => {
    setForm({
      fullName: addr.name,
      mobile: addr.phone,
      pincode: addr.pincode,
      locality: addr.line2.split(', ')[0] || '',
      address: addr.line1.replace(/,$/, '').trim(),
      city: addr.line2.split(', ')[1] || '',
      state: addr.line2.split(', ')[2]?.replace(' -', '').trim() || '',
      landmark: addr.landmark || '',
      altPhone: addr.altPhone || '',
      type: addr.type.charAt(0) + addr.type.slice(1).toLowerCase(),
      isDefault: addr.isDefault || false
    });
    setEditingId(addr.id);
    setMenuOpen(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    let updatedAddresses = [];

    // ── 1. Clear from localStorage if it was the active/selected delivery address ──
    // Two keys are used across pages: product detail page uses 'sumathi_active_address',
    // cart page uses 'sumathi_selected_address'. Clear both if they point to this address.
    const KEYS_TO_CHECK = ['sumathi_active_address', 'sumathi_selected_address'];
    for (const key of KEYS_TO_CHECK) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const stored = JSON.parse(raw);
          if (String(stored.id || stored._id) === String(id)) {
            localStorage.removeItem(key);
          }
        }
      } catch { }
    }

    // ── 2. Delete from server or local guest storage ──
    if (userUid) {
      const res = await authFetch(`/api/client-auth/addresses/${userUid}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        updatedAddresses = data.addresses;
        setAddresses_(updatedAddresses);

        // If the deleted address was the default, also auto-promote the
        // first remaining address as the new default (optional UX choice).
        // We do NOT auto-select it as the active address — we intentionally
        // leave selectedAddress blank so the user must pick a new one.
      }
    } else {
      const addressToDelete = addresses.find(x => x.id === id);
      const wasDefault = addressToDelete?.isDefault;

      updatedAddresses = addresses.filter(x => x.id !== id);

      // If deleted was default, make the next one default
      if (wasDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
      }

      setAddresses_(updatedAddresses);
      try { localStorage.setItem('sumathi_addresses', JSON.stringify(updatedAddresses)); } catch { }
    }

    // ── 3. Broadcast so ProductInfo / AddressSidebar / cart pages clear stale state ──
    broadcastAddressChange(updatedAddresses, id);

    setMenuOpen(null);
    if (editingId === id) { setEditingId(null); setForm(emptyForm); setShowForm(false); }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const handleLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Step 1: Reverse geocode using OpenStreetMap Nominatim (free, no API key)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};

          // Extract pincode
          const pincode = addr.postcode ? addr.postcode.replace(/\s/g, '').slice(0, 6) : '';

          // Extract city
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.county ||
            addr.state_district ||
            '';

          // Extract locality — use postcode-level name first (most accurate for Indian addresses),
          // then fall back to suburb, then neighbourhood (which can be a micro-area like "Maruthi Nagara")
          const locality =
            addr.suburb ||
            addr.city_district ||
            addr.town ||
            addr.village ||
            addr.neighbourhood ||
            addr.quarter ||
            addr.residential ||
            '';

          // Extract state — match against INDIAN_STATES list for correct dropdown value
          const rawState = addr.state || '';
          const matchedState = INDIAN_STATES.find(
            s => s.toLowerCase() === rawState.toLowerCase()
          ) || rawState;

          // Fill the form fields
          if (pincode) handleChange('pincode', pincode);
          if (city) handleChange('city', city);
          if (matchedState) handleChange('state', matchedState);
          if (locality) handleChange('locality', locality);

          // Step 2: Shiprocket serviceability check on the detected pincode
          if (pincode && pincode.length === 6) {
            try {
              const pinRes = await fetch(`/api/shiprocket/check-pincode/${pincode}`);
              const pinData = await pinRes.json();
              if (!pinData.serviceable) {
                alert(`Delivery Not Available: Shiprocket does not currently deliver to pincode ${pincode}. You can still save the address but delivery may not be possible.`);
              }
            } catch (pinErr) {
              console.warn('Shiprocket serviceability check failed:', pinErr);
              // Non-blocking — don't prevent form fill if this check fails
            }
          }

        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          alert('Could not fetch location details. Please fill in the address manually.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Unable to retrieve your location. Please check your browser permissions.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="ma-page" onClick={() => setMenuOpen(null)}>
      <div className="ma-container">

        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          activeSubNav={activeSubNav}
          setActiveSubNav={setActiveSubNav}
        />

        <main className="ma-main">

          <div className="ma-mobile-header">
            <button className="mobile-back-btn" onClick={() => navigate('/account')}>
            </button>
            <div className="ma-header">
              <h1>Manage Addresses</h1>
              <p>Add or edit your shipping details for a faster checkout experience.</p>
            </div>
          </div>

          {/* ADD A NEW ADDRESS trigger — always visible */}
          {!showForm && (
            <div className="ma-add-trigger" onClick={() => setShowForm(true)}>
              <span className="ma-add-plus">+</span>
              <span className="ma-add-label">ADD A NEW ADDRESS</span>
            </div>
          )}

          {/* Form — only shown when showForm is true */}
          {showForm && (
            <div className="ma-form-section">
              <div className="ma-form-title-row">
                <span className="ma-form-title">{editingId ? 'EDIT ADDRESS' : 'ADD A NEW ADDRESS'}</span>
                <button
                  className={`ma-location-btn ${locating ? 'ma-locating' : ''}`}
                  onClick={handleLocation}
                  disabled={locating}
                >
                  {locating ? ' Locating...' : 'Use my current location'}
                </button>
              </div>

              <div className="ma-form-grid">
                <div className="ma-field">
                  <label>FULL NAME</label>
                  <input type="text" placeholder="Enter recipient's name"
                    value={form.fullName}
                    onChange={e => handleChange('fullName', e.target.value.replace(/[^a-zA-Z\s]/g, ''))} />
                  {errors.fullName && <span className="ma-error">{errors.fullName}</span>}
                </div>
                <div className="ma-field">
                  <label>MOBILE NUMBER</label>
                  <input type="tel" placeholder="10-digit mobile number"
                    value={form.mobile} maxLength={10}
                    onChange={e => handleChange('mobile', e.target.value.replace(/\D/g, ''))} />
                  {errors.mobile && <span className="ma-error">{errors.mobile}</span>}
                </div>
                <div className="ma-field">
                  <label>PINCODE</label>
                  <input type="text" placeholder="6-digit pincode"
                    value={form.pincode} maxLength={6}
                    onChange={e => handleChange('pincode', e.target.value.replace(/\D/g, ''))} />
                  {errors.pincode && <span className="ma-error">{errors.pincode}</span>}
                </div>
                <div className="ma-field">
                  <label>LOCALITY</label>
                  <input type="text" placeholder="e.g. Bandra West"
                    value={form.locality}
                    onChange={e => handleChange('locality', e.target.value)} />
                  {errors.locality && <span className="ma-error">{errors.locality}</span>}
                </div>
                <div className="ma-field ma-field-full">
                  <label>ADDRESS (AREA AND STREET)</label>
                  <textarea placeholder="Flat, House no., Building, Company, Apartment"
                    value={form.address}
                    onChange={e => handleChange('address', e.target.value)} rows={3} />
                  {errors.address && <span className="ma-error">{errors.address}</span>}
                </div>
                <div className="ma-field">
                  <label>CITY / DISTRICT / TOWN</label>
                  <input type="text" placeholder="e.g. Mumbai"
                    value={form.city}
                    onChange={e => handleChange('city', e.target.value)} />
                  {errors.city && <span className="ma-error">{errors.city}</span>}
                </div>
                <div className="ma-field">
                  <label>STATE</label>
                  <select value={form.state} onChange={e => handleChange('state', e.target.value)}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <span className="ma-error">{errors.state}</span>}
                </div>
                <div className="ma-field">
                  <label>LANDMARK (OPTIONAL)</label>
                  <input type="text" placeholder="e.g. Near Apollo Hospital"
                    value={form.landmark}
                    onChange={e => handleChange('landmark', e.target.value)} />
                </div>
                <div className="ma-field">
                  <label>ALTERNATE PHONE (OPTIONAL)</label>
                  <input type="tel" placeholder="Alternate mobile number"
                    value={form.altPhone} maxLength={10}
                    onChange={e => handleChange('altPhone', e.target.value.replace(/\D/g, ''))} />
                </div>
                <div className="ma-field ma-field-full">
                  <label>ADDRESS TYPE</label>
                  <div className="ma-radio-group">
                    <label className={`ma-radio ${form.type === 'Home' ? 'ma-radio-selected' : ''}`}>
                      <input type="radio" name="addrType" value="Home"
                        checked={form.type === 'Home'}
                        onChange={() => handleChange('type', 'Home')}
                        onClick={() => { if (form.type === 'Home') handleChange('type', ''); }} />
                      Home
                    </label>
                    <label className={`ma-radio ${form.type === 'Work' ? 'ma-radio-selected' : ''}`}>
                      <input type="radio" name="addrType" value="Work"
                        checked={form.type === 'Work'}
                        onChange={() => handleChange('type', 'Work')}
                        onClick={() => { if (form.type === 'Work') handleChange('type', ''); }} />
                      Work
                    </label>
                  </div>
                  {errors.type && <span className="ma-error">{errors.type}</span>}
                </div>

                <div className="ma-field ma-field-full">
                  <label className="ma-checkbox-container">
                    <div className="ma-checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={form.isDefault || false}
                        onChange={e => handleChange('isDefault', e.target.checked)}
                      />
                      <span className="ma-checkmark"></span>
                    </div>
                    <span className="ma-checkbox-text">MAKE THIS MY DEFAULT ADDRESS</span>
                  </label>
                </div>
              </div>

              <div className="ma-form-actions">
                <button className="ma-btn-save" onClick={handleSave} disabled={validatingPin}>
                  {validatingPin ? 'VERIFYING PINCODE...' : saved ? 'SAVED!' : editingId ? 'UPDATE ADDRESS' : 'SAVE ADDRESS'}
                </button>
                <button className="ma-btn-cancel" onClick={handleCancel}>CANCEL</button>
              </div>
            </div>
          )}

          {/* Saved Addresses — always visible below */}
          {addresses.length > 0 && (
            <div className="ma-saved-section">
              <div className="ma-saved-header">
                <span className="ma-saved-title">SAVED ADDRESSES</span>
                <span className="ma-saved-count">{addresses.length} Address{addresses.length !== 1 ? 'es' : ''} found</span>
              </div>
              {addresses.map(addr => (
                <div key={addr.id} className="ma-address-card">
                  <div className="ma-address-top" style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="ma-addr-type">{addr.type}</span>
                    {addr.isDefault && <span style={{ marginLeft: '12px', fontSize: '11px', fontWeight: 'bold', color: '#ff3e6c', backgroundColor: '#ffeeef', padding: '2px 8px', borderRadius: '4px' }}>DEFAULT</span>}
                    <div className="ma-menu-wrap" onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === addr.id ? null : addr.id); }} style={{ marginLeft: 'auto' }}>
                      <button className="ma-addr-menu">⋮</button>
                      {menuOpen === addr.id && (
                        <div className="ma-dropdown">
                          <button onClick={() => handleEdit(addr)}>Edit</button>
                          <button className="ma-dropdown-delete" onClick={() => handleDelete(addr.id)}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ma-addr-name">{addr.name} <span className="ma-addr-phone">{addr.phone}</span></div>
                  <div className="ma-addr-text">{addr.line1}<br />{addr.line2} <strong>{addr.pincode}</strong></div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}