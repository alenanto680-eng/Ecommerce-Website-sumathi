// ── admin/views/ProductManagement.jsx ──
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/productmanagement.css';

const API = '/api/products';
const authHeaders = () => ({
  'Content-Type': 'application/json'
});

const AGE_GROUPS = [
  { value: 'newborn', label: '0–6 Months (Newborn)' },
  { value: 'infant', label: '6–12 Months (Infant)' },
  { value: 'toddler', label: '1–3 Years (Toddler)' },
  { value: 'little-girls', label: '3–6 Years (Little Girls)' },
  { value: 'kids', label: '6–9 Years (Kids)' },
  { value: 'pre-teen', label: '9–12 Years (Pre-Teen)' },
];
const AGE_LABELS = {
  'newborn': '0–6 Months', 'infant': '6–12 Months', 'toddler': '1–3 Years',
  'little-girls': '3–6 Years', 'kids': '6–9 Years', 'pre-teen': '9–12 Years'
};
// Per-age-group individual size keys for inventory
const AGE_GROUP_SIZES = {
  'newborn': ['0M', '1M', '2M', '3M', '4M', '5M', '6M'],
  'infant': ['6M', '7M', '8M', '9M', '10M', '11M', '12M'],
  'toddler': ['1Y', '2Y', '3Y'],
  'little-girls': ['3Y', '4Y', '5Y', '6Y'],
  'kids': ['6Y', '7Y', '8Y', '9Y'],
  'pre-teen': ['9Y', '10Y', '11Y', '12Y'],
};
// Compute all unique size keys for the selected age groups (in display order)
const getSizeKeys = (ageGroups) => {
  const seen = new Set();
  const keys = [];
  (ageGroups || []).forEach(ag => {
    (AGE_GROUP_SIZES[ag] || []).forEach(k => {
      if (!seen.has(k)) { seen.add(k); keys.push(k); }
    });
  });
  return keys;
};
const CATEGORIES = [
  'Occasion & Daily Wear Frocks',
  'Party Wear Collection',
  'Designer & Premium Frocks',
  'Traditional & Ethnic Frocks',
  'Fabric-Based Categories'
];
const SUBCATEGORIES = {
  'Occasion & Daily Wear Frocks': [
    'Birthday Party Frocks', 'Wedding / Festive Frocks', 'Reception / Evening Wear',
    'Photoshoot Special Frocks', 'Princess / Fancy Dress', 'Casual Cotton Frocks',
    'Playtime Frocks', 'School Casual Frocks', 'Summer Wear Frocks', 'Comfortable Home Wear'
  ],
  'Party Wear Collection': [
    'Net Frocks', 'Gown Style Frocks', 'Layered / Frill Frocks',
    'Sequin / Glitter Frocks', 'Princess Frocks', 'Satin / Silk Dress',
    'Velvet Frocks', 'Floral Embellished Frocks', 'Indo-Western Party Gowns',
    'High-Low Frocks'
  ],
  'Designer & Premium Frocks': [
    'Boutique Designer Frocks', 'Handwork / Embroidery Frocks',
    'Custom Made Frocks', 'Luxury Collection'
  ],
  'Traditional & Ethnic Frocks': [
    'Pattu Pavadai (Silk Frocks)', 'Banarasi Silk Frocks', 'Lehenga Choli Frocks',
    'Anarkali Style Frocks', 'Cotton Ethnic Frocks', 'Indo-Western Fusion Frocks',
    'Gota Patti / Zari Work Frocks', 'Kalamkari / Block Print Frocks',
    'Dhoti Style Frocks', 'Half-Saree Style Frocks'
  ],
  'Fabric-Based Categories': [
    'Cotton Frocks', 'Net Frocks', 'Satin Frocks', 'Silk Frocks',
    'Organza Frocks', 'Velvet Frocks (Winter Special)'
  ]
};
const BADGES = ['', 'New', 'Bestselling'];
const EMPTY_FORM = {
  name: '',
  category: [],
  subCategory: [],
  price: '',
  oldPrice: '',
  ageGroup: [],
  badge: '',
  inventory: {},
  stock: 0,
  colors: []
};

const SECTION_LIMITS = {
  currentFavorites: 4,
  youMightAlsoLike: 4,
  cartAlsoLike: 4,
  bestSelling: 10,
  newArrivals: 4,
};

// --- Multi-Select Component ---
function SearchableMultiSelect({ label, options, selected, onChange, placeholder = "Select..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => {
    const labelText = typeof opt === 'string' ? opt : opt.label;
    return labelText.toLowerCase().includes(query.toLowerCase());
  });

  const toggleOption = (val) => {
    const updated = selected.includes(val)
      ? selected.filter(v => v !== val)
      : [...selected, val];
    onChange(updated);
  };

  return (
    <div className="pm-group" ref={containerRef}>
      <label>{label}</label>
      <div className="pm-multiselect">
        <div className="pm-ms-field" onClick={() => setIsOpen(true)}>
          {selected.map(val => {
            const opt = options.find(o => (typeof o === 'string' ? o : o.value) === val);
            const display = opt ? (typeof opt === 'string' ? opt : opt.label) : val;
            return (
              <span key={val} className="pm-ms-chip">
                {display}
                <button type="button" className="pm-ms-remove" onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(val);
                }}>×</button>
              </span>
            );
          })}
          <input
            className="pm-ms-input"
            placeholder={selected.length === 0 ? placeholder : ""}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
        </div>
        {isOpen && (
          <div className="pm-ms-dropdown">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => {
                const val = typeof opt === 'string' ? opt : opt.value;
                const lab = typeof opt === 'string' ? opt : opt.label;
                const isSelected = selected.includes(val);
                return (
                  <div
                    key={val}
                    className={`pm-ms-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleOption(val)}
                  >
                    {lab} {isSelected && " ✓"}
                  </div>
                );
              })
            ) : (
              <div className="pm-ms-empty">No options found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductManagement() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM, colors: [] });
  const [editId, setEditId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterAge, setFilterAge] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const fileRef = useRef(null);
  const formRef = useRef(null);
  const [expandedProductCats, setExpandedProductCats] = useState({});
  const [expandedStock, setExpandedStock] = useState({});

  const toggleProductCats = (id) => {
    setExpandedProductCats(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleStock = (id) => {
    setExpandedStock(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAutoRotateToggle = () => {
    setIsAutoRotate(!isAutoRotate);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API}/admin`, {
        headers: authHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch { setError('Failed to load products.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleEdit = (p) => {
    setEditId(p._id);
    // MongoDB Map via .lean() can come back as a plain object OR a Map instance.
    // Also handle the case where it's serialised as { '0': {...} } (nested).
    let rawInv = {};
    if (p.inventory) {
      if (p.inventory instanceof Map) {
        rawInv = Object.fromEntries(p.inventory);
      } else if (typeof p.inventory === 'object') {
        // Check it's a flat size→qty map (keys look like '1Y', '6M', etc.)
        // not a MongoDB Map serialisation artefact
        rawInv = p.inventory;
      }
    }
    // Pre-populate ALL size keys for the product's age groups, defaulting missing ones to 0
    const ageGrps = Array.isArray(p.ageGroup) ? p.ageGroup : [p.ageGroup];
    const allSizes = getSizeKeys(ageGrps);
    const normInv = {};
    allSizes.forEach(size => {
      normInv[size] = Number(rawInv[size]) || 0;
    });
    // Also keep any extra sizes already in rawInv that aren't in the size list
    Object.entries(rawInv).forEach(([k, v]) => {
      if (!(k in normInv)) normInv[k] = Number(v) || 0;
    });
    setForm({
      name: p.name,
      category: Array.isArray(p.category) ? p.category : [p.category],
      subCategory: Array.isArray(p.subCategory) ? p.subCategory : (p.subCategory ? [p.subCategory] : []),
      price: p.price,
      oldPrice: p.oldPrice || '',
      ageGroup: Array.isArray(p.ageGroup) ? p.ageGroup : [p.ageGroup],
      badge: p.badge || '',
      inventory: normInv,
      stock: p.stock != null ? p.stock : 0,
      colors: p.colors || []
    });
    setPreview(p.img);
    setImgFile(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancel = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setPreview(null);
    setImgFile(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!editId && !imgFile) { setError('Please select a product image.'); return; }
    if (!form.name || !form.category || !form.subCategory || !form.price) { setError('Name, category, sub-category, and price are required.'); return; }

    setSaving(true);
    try {
      // Compute total stock from per-size inventory
      const inventoryValues = Object.values(form.inventory || {});
      const computedStock = inventoryValues.length > 0
        ? inventoryValues.reduce((sum, n) => sum + (Number(n) || 0), 0)
        : Number(form.stock) || 0;

      const fd = new FormData();
      Object.entries({ ...form, stock: computedStock }).forEach(([k, v]) => {
        if (k === 'inventory') {
          // Always send inventory so the backend can persist per-size data
          fd.append(k, JSON.stringify(v && typeof v === 'object' ? v : {}));
        } else if (k === 'stock') {
          fd.append(k, v);
        } else if (Array.isArray(v)) {
          fd.append(k, JSON.stringify(v));
        } else {
          fd.append(k, v);
        }
      });

      const ageLabels = form.ageGroup.map(ag => AGE_LABELS[ag]).join(', ');
      fd.append('age', ageLabels);
      if (imgFile) fd.append('image', imgFile);

      const url = editId ? `${API}/${editId}` : `${API}`;
      const method = editId ? 'PUT' : 'POST';
      // Multipart fetch doesn't need Content-Type header manually
      const res = await fetch(url, {
        method,
        credentials: 'include',
        body: fd
      });
      const data = await res.json();

      if (data.success) {
        if (editId) {
          setProducts(p => p.map(x => x._id === editId ? data.data : x));
        } else {
          setProducts(p => [data.data, ...p]);
        }
        handleCancel();
      } else {
        setError(data.message || 'Failed to save product.');
      }
    } catch { setError('Server error.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This will also remove the image from storage.`)) return;
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) setProducts(p => p.filter(x => x._id !== id));
    } catch { setError('Server error.'); }
  };

  const handleFeaturedToggle = async (id, section, isCurrentlyOn) => {
    const product = products.find(p => p._id === id);
    if (!product) return;
    const current = product.featuredIn || [];
    const updated = isCurrentlyOn
      ? current.filter(s => s !== section)
      : [...current, section];

    if (!isCurrentlyOn) {
      const limit = SECTION_LIMITS[section];
      const currentCount = products.filter(p =>
        (p.featuredIn || []).includes(section)
      ).length;
      if (currentCount >= limit) {
        setError(`Maximum ${limit} products allowed in this section. Remove one first.`);
        return;
      }
    }

    setError('');
    setProducts(prev =>
      prev.map(x => x._id === id ? { ...x, featuredIn: updated } : x)
    );

    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ featuredIn: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.map(x => x._id === id ? data.data : x));
      } else {
        setProducts(prev =>
          prev.map(x => x._id === id ? { ...x, featuredIn: current } : x)
        );
        setError(data.message || 'Failed to update.');
      }
    } catch {
      setProducts(prev =>
        prev.map(x => x._id === id ? { ...x, featuredIn: current } : x)
      );
      setError('Server error.');
    }
  };

  const displayed = products.filter(p => {
    const pAges = Array.isArray(p.ageGroup) ? p.ageGroup : [p.ageGroup];
    const matchAge = filterAge === 'all' || pAges.includes(filterAge);
    const matchName = searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.trim().toLowerCase());

    const matchStock = filterStock === 'all' || (() => {
      const sQty = Number(p.stock) || 0;
      return filterStock === 'out' ? sQty === 0 : sQty > 0;
    })();

    return matchAge && matchName && matchStock;
  });

  const FeatToggle = ({ id, section, featuredIn }) => {
    const active = (featuredIn || []).includes(section);

    const limit = SECTION_LIMITS[section];
    const currentCount = products.filter(p =>
      (p.featuredIn || []).includes(section)
    ).length;
    const isDisabled = !active && currentCount >= limit;

    return (
      <button
        className={`pm-feat-circle${isDisabled ? ' pm-feat-disabled' : ''}`}
        onClick={() => !isDisabled && handleFeaturedToggle(id, section, active)}
        title={isDisabled ? `Max ${limit} allowed` : ''}
      >
        <img
          src={active ? '/images/ProductManagement/tick.png' : '/images/ProductManagement/cross.png'}
          alt={active ? 'on' : 'off'}
        />
      </button>
    );
  };

  return (
    <div className="pm-page">
      <h1 className="pm-title">Product management</h1>

      <div className="pm-form-card" ref={formRef}>
        <h3 className="pm-form-title">{editId ? 'Edit Product' : 'Add New Product'}</h3>

        {error && <div className="pm-error">{error}</div>}

        <form className="pm-form" onSubmit={handleSubmit}>
          <div className="pm-form-grid">

            <div className="pm-img-col">
              <div className="pm-img-upload" onClick={() => fileRef.current.click()}>
                {preview
                  ? <img src={preview} alt="preview" className="pm-img-preview" />
                  : <div className="pm-img-placeholder">+ Upload Image</div>
                }
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImgChange} style={{ display: 'none' }} />
              </div>
              {preview && (
                <button type="button" className="pm-red-btn" onClick={() => { setPreview(null); setImgFile(null); }}>
                  Remove Image
                </button>
              )}
            </div>

            <div className="pm-fields">
              <div className="pm-row">
                <div className="pm-group">
                  <label>Product Name *</label>
                  <input type="text" placeholder="e.g. Garden Breeze Dress"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="pm-group">
                  <label>Price (₹) <span className="pm-required">*</span></label>
                  <input type="number" placeholder="e.g. 849" min="0" className="pm-premium-input"
                    value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
              </div>

              <div className="pm-row">
                <SearchableMultiSelect
                  label="Categories *"
                  options={CATEGORIES}
                  selected={form.category}
                  onChange={(updated) => setForm({ ...form, category: updated, subCategory: [] })}
                  placeholder="Choose categories..."
                />

                <SearchableMultiSelect
                  label="Age Groups *"
                  options={AGE_GROUPS.map(ag => ({ value: ag.value, label: ag.label }))}
                  selected={form.ageGroup}
                  onChange={(updated) => setForm({ ...form, ageGroup: updated })}
                  placeholder="Choose age groups..."
                />
              </div>

              <SearchableMultiSelect
                label="Sub Categories *"
                options={[...new Set(form.category.flatMap(cat => SUBCATEGORIES[cat] || []))]}
                selected={form.subCategory}
                onChange={(updated) => setForm({ ...form, subCategory: updated })}
                placeholder="Choose sub-categories..."
              />

              {/* Inventory Grid */}
              {form.ageGroup.length > 0 && (
                <div className="pm-inventory-section" style={{ marginTop: '1.5rem' }}>
                  <label className="pm-label" style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem', display: 'block' }}>Stock by Size (Age Groups)</label>
                  <p className="pm-section-hint" style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>Manage variant details and inventory</p>
                  <div className="pm-inventory-grid-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '0.75rem' }}>
                    {getSizeKeys(form.ageGroup).map(size => (
                      <div key={size} className="pm-inventory-item-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '500' }}>{size}</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          style={{ padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.85rem' }}
                          value={form.inventory[size] || ''}
                          onChange={e => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                            setForm(f => ({
                              ...f,
                              inventory: { ...f.inventory, [size]: val }
                            }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pm-form-actions">
            {editId && <button type="button" className="pm-cancel-btn" onClick={handleCancel}>Cancel</button>}
            <button type="submit" className="pm-save-btn" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>

      <div className="pm-existing-card">
        <div className="pm-section-header">
          <div className="pm-section-title-wrap">
            <h2 className="pm-section-title">Existing products ({displayed.length})</h2>
            <div className="pm-auto-toggle-wrap">
              <span className="pm-auto-toggle-label">Auto Rotate</span>
              <label className="pm-switch">
                <input type="checkbox" checked={isAutoRotate} onChange={handleAutoRotateToggle} />
                <span className="pm-slider"></span>
              </label>
            </div>
          </div>

          <div className="pm-section-controls">
            <div className="pm-search-wrap">
              <input
                type="text"
                className="pm-search-input"
                placeholder="Search by product name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="button" className="pm-search-btn">
                <img src="/images/ProductManagement/search.png" alt="Search" />
              </button>
            </div>

            <div className="pm-age-filters">
              {['all', 'newborn', 'infant', 'toddler', 'little-girls', 'kids', 'pre-teen'].map(f => (
                <button key={f}
                  className={`pm-filter-btn${filterAge === f ? ' active' : ''}`}
                  onClick={() => setFilterAge(f)}>
                  {f === 'all' ? 'All' : AGE_LABELS[f]}
                </button>
              ))}
            </div>

            <div className="pm-age-filters pm-stock-filters">
              {['all', 'instock', 'out'].map(s => (
                <button key={s}
                  className={`pm-filter-btn${filterStock === s ? ' active' : ''}`}
                  onClick={() => setFilterStock(s)}>
                  {s === 'all' ? 'Stock: All' : s === 'instock' ? 'In Stock' : 'Low/Out'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pm-table-outer">
          {loading ? <p className="pm-empty">Loading...</p>
            : displayed.length === 0 ? <p className="pm-empty">No products found.</p>
              : (
                <table className="pm-table">
                  <thead>
                    <tr>
                      <th>IMAGE</th>
                      <th>NAME & CATEGORY</th>
                      <th>AGE</th>
                      <th>STOCK</th>
                      <th>PRICE</th>
                      <th>BADGE</th>
                      <th className="pm-th-featured">
                        <div className="pm-th-feat-wrap">
                          <span>Detail (4) |</span>
                          <span>Cart (4)</span>
                        </div>
                      </th>
                      <th>BEST (10)</th>
                      <th>NEW (4)</th>

                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map(p => (
                      <tr key={p._id}>
                        <td><img src={p.img} alt={p.name} className="pm-thumb" /></td>
                        <td>
                          <div className="pm-name" title={p.name}>{p.name}</div>
                          {(() => {
                            const cats = Array.isArray(p.category) ? p.category : [p.category];
                            const subcats = Array.isArray(p.subCategory) ? p.subCategory : (p.subCategory ? [p.subCategory] : []);
                            const hasMore = cats.length > 1 || subcats.length > 1;
                            const isEx = expandedProductCats[p._id];

                            return (
                              <div className="pm-cat-cell">
                                <div className="pm-cat-row-main">
                                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                    <div className="pm-cat">{cats[0]}</div>
                                    {subcats[0] && (
                                      <div className="pm-cat" style={{ color: '#64748b', fontSize: '0.7rem' }}>
                                        {subcats[0]}
                                      </div>
                                    )}
                                  </div>
                                  {hasMore && (
                                    <button
                                      className={`pm-cat-chevron ${isEx ? 'expanded' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleProductCats(p._id);
                                      }}
                                      title={isEx ? "Show less" : "Show all categories"}
                                    >
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                {isEx && hasMore && (
                                  <div className="pm-cat-expanded-list">
                                    {cats.map((c, i) => (
                                      <div key={`c-${i}`} className="pm-cat-item">• {c}</div>
                                    ))}
                                    {subcats.length > 0 && <div className="pm-subcat-label">Sub Categories</div>}
                                    {subcats.map((sc, i) => (
                                      <div key={`sc-${i}`} className="pm-subcat-item">• {sc}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="pm-age">
                          <div className="pm-age-grid">
                            {p.age ? p.age.split(', ').map((age, i) => {
                              const shortAge = age
                                .replace(/years?/gi, 'Y')
                                .replace(/months?/gi, 'M');
                              return (
                                <span key={i} className="pm-age-tag">{shortAge}</span>
                              );
                            }) : '—'}
                          </div>
                        </td>
                        <td className="pm-stock">
                          {(() => {
                            const sQty = Number(p.stock) || 0;
                            const status = sQty > 10 ? 'healthy' : sQty > 0 ? 'low' : 'out';
                            // Robustly parse inventory regardless of how MongoDB serialised the Map
                            let inv = {};
                            if (p.inventory instanceof Map) {
                              inv = Object.fromEntries(p.inventory);
                            } else if (p.inventory && typeof p.inventory === 'object') {
                              inv = p.inventory;
                            }
                            const invEntries = Object.entries(inv)
                              .filter(([, v]) => Number(v) > 0)
                              .sort(([a], [b]) => {
                                // Sort by numeric part: '1Y' < '2Y', '6M' < '12M'
                                const numA = parseInt(a) || 0;
                                const numB = parseInt(b) || 0;
                                if (numA !== numB) return numA - numB;
                                return a.localeCompare(b);
                              });
                            const isStockEx = expandedStock[p._id];
                            return (
                              <div className="pm-stock-wrap">
                                <div className="pm-stock-row">
                                  <div className={`pm-stock-pill status-${status}`}>
                                    {sQty > 0 ? `${sQty} In Stock` : 'Out of Stock'}
                                  </div>
                                  {invEntries.length > 0 && (
                                    <button
                                      className={`pm-stock-chevron${isStockEx ? ' expanded' : ''}`}
                                      onClick={e => { e.stopPropagation(); toggleStock(p._id); }}
                                      title={isStockEx ? 'Hide breakdown' : 'Show per-size stock'}
                                    >
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                {isStockEx && invEntries.length > 0 && (
                                  <div className="pm-stock-breakdown">
                                    {invEntries.map(([size, qty]) => (
                                      <div key={size} className="pm-stock-size-row">
                                        <span className="pm-stock-size-label">{size}</span>
                                        <span className="pm-stock-size-qty">{qty}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="pm-price">
                          ₹{p.price}
                          {p.oldPrice && <><br /><span className="pm-old-price">₹{p.oldPrice}</span></>}
                        </td>
                        <td>
                          {p.badge
                            ? <span className={`pm-badge pm-badge-${p.badge.toLowerCase()}`}>{p.badge}</span>
                            : <span className="pm-badge-none">—</span>}
                        </td>
                        <td className="pm-td-featured">
                          <div className="pm-feat-icons">
                            {['youMightAlsoLike', 'cartAlsoLike'].map(key => (
                              <FeatToggle key={key} id={p._id} section={key} featuredIn={p.featuredIn} />
                            ))}
                          </div>
                        </td>
                        <td className="pm-td-center">
                          <div className="pm-feat-icons">
                            <FeatToggle id={p._id} section="bestSelling" featuredIn={p.featuredIn} />
                          </div>
                        </td>
                        <td className="pm-td-center">
                          <div className="pm-feat-icons">
                            <FeatToggle id={p._id} section="newArrivals" featuredIn={p.featuredIn} />
                          </div>
                        </td>

                        <td>
                          <div className="pm-actions">
                            <button className="pm-edit-btn" onClick={() => handleEdit(p)}>
                              <img src="/images/ProductManagement/edit.png" alt="Edit" />
                            </button>
                            <button
                              className="pm-details-btn"
                              onClick={() => navigate(`/admin/products/${p._id}/details`)}
                            >
                              <img src="/images/ProductManagement/details.png" alt="Details" />
                            </button>
                            <button className="pm-del-btn" onClick={() => handleDelete(p._id, p.name)}>
                              <img src="/images/ProductManagement/delete.png" alt="Delete" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
        </div>
      </div>
    </div>
  );
}