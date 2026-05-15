// ── admin/views/ProductDetailPage.jsx ──
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../assets/productdetailpage.css';

const API      = '/api';
const authHdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

const MAX_GALLERY = 7;

const EMPTY_SPEC  = { label: '', value: '' };
const EMPTY_COLOR = { name: '', productName: '', hex: '#F2C4B0', hexArray: ['#F2C4B0'], price: '' };

const uuid = () => Math.random().toString(36).slice(2, 9);

const colorKey = (name) => name.toLowerCase().replace(/\s+/g, '_');

const AGE_GROUP_SIZES = {
  'newborn': ['0M', '1M', '2M', '3M', '4M', '5M', '6M'],
  'infant': ['6M', '7M', '8M', '9M', '10M', '11M', '12M'],
  'toddler': ['1Y', '2Y', '3Y'],
  'little-girls': ['3Y', '4Y', '5Y', '6Y'],
  'kids': ['6Y', '7Y', '8Y', '9Y'],
  'pre-teen': ['9Y', '10Y', '11Y', '12Y'],
};

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

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate      = useNavigate();

  const [product, setProduct] = useState(null);
  const pageRef = useRef(null);

  // colorGalleries: { [colorKey]: [ { id, file?, preview, url? }, ... ] }
  const [colorGalleries, setColorGalleries] = useState({});
  const [activeColorId,  setActiveColorId]  = useState(null);

  const [sizes,            setSizes]            = useState(['']);
  const [colors,           setColors]           = useState([{ ...EMPTY_COLOR, id: uuid() }]);
  const [specifications,   setSpecifications]    = useState([{ ...EMPTY_SPEC, id: uuid() }]);
  const [description,      setDescription]       = useState('');
  const [manufacturerInfo, setManufacturerInfo]  = useState([{ ...EMPTY_SPEC, id: uuid() }]);
  const [highlights,       setHighlights]        = useState([{ ...EMPTY_SPEC, id: uuid() }]);
  const [inventory,        setInventory]         = useState({});

  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  /* ── Load ── */
  useEffect(() => {
    const load = async () => {
      try {
        const pRes  = await fetch(`${API}/products/admin`, { headers: authHdrs() });
        const pData = await pRes.json();
        if (pData.success) {
          const p = pData.data.find(x => x._id === productId);
          setProduct(p || null);
        }

        const dRes  = await fetch(`${API}/product-details/admin/${productId}`, { headers: authHdrs() });
        const dData = await dRes.json();
        if (dData.success && dData.data) {
          const d = dData.data;

          if (d.sizes?.length)   setSizes(d.sizes);
          if (d.description)     setDescription(d.description);
          if (d.specifications?.length)   setSpecifications(d.specifications.map(s => ({ ...s, id: uuid() })));
          if (d.manufacturerInfo?.length) setManufacturerInfo(d.manufacturerInfo.map(s => ({ ...s, id: uuid() })));
          if (d.highlights?.length)       setHighlights(d.highlights.map(s => ({ ...s, id: uuid() })));

          if (d.inventory) {
            setInventory(d.inventory instanceof Map ? Object.fromEntries(d.inventory) : d.inventory);
          }

          if (d.colors?.length) {
            const loadedColors = d.colors.map(c => ({ 
              ...c, 
              hexArray: c.hexArray && c.hexArray.length ? c.hexArray : [c.hex],
              id: uuid() 
            }));
            setColors(loadedColors);
            setActiveColorId(loadedColors[0].id);

            // Load per-color galleries
            const galleries = {};
            loadedColors.forEach(c => {
              const key   = colorKey(c.name);
              const entry = d.colorGalleries?.find(g => g.colorName === key);
              galleries[c.id] = (entry?.images || []).map(url => ({ id: uuid(), url, preview: url, file: null }));
            });
            setColorGalleries(galleries);
          } else {
            setActiveColorId(colors[0]?.id || null);
          }
        }
      } catch {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  /* ── When colors change, keep colorGalleries in sync ── */
  const addColor = () => {
    const newColor = { ...EMPTY_COLOR, id: uuid() };
    setColors(c => [...c, newColor]);
    setColorGalleries(g => ({ ...g, [newColor.id]: [] }));
    setActiveColorId(newColor.id);
  };

  const removeColor = (id) => {
    setColors(c => c.filter(x => x.id !== id));
    setColorGalleries(g => { const n = { ...g }; delete n[id]; return n; });
    setActiveColorId(prev => prev === id ? (colors.find(c => c.id !== id)?.id || null) : prev);
  };

  const updateColor = (id, k, v) => {
    if (k === 'name') {
      const oldName = colors.find(c => c.id === id)?.name || '';
      if (oldName && oldName !== v) {
        setInventory(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(key => {
            if (key.startsWith(`${oldName}:`)) {
              const size = key.split(':')[1];
              next[`${v}:${size}`] = next[key];
              delete next[key];
            }
          });
          return next;
        });
      }
    }
    setColors(c => c.map(x => x.id === id ? { ...x, [k]: v } : x));
  };

  const addHexToColor = (id) => {
    setColors(curr => curr.map(c => {
      if (c.id !== id) return c;
      const arr = c.hexArray || [c.hex];
      if (arr.length >= 4) return c; // Max 4 colors
      return { ...c, hexArray: [...arr, '#ffffff'] };
    }));
  };

  const removeHexFromColor = (id, index) => {
    setColors(curr => curr.map(c => {
      if (c.id !== id) return c;
      const arr = (c.hexArray || [c.hex]).filter((_, i) => i !== index);
      if (arr.length === 0) return c; 
      return { ...c, hexArray: arr, hex: arr[0] };
    }));
  };

  const updateHexInArray = (id, index, value) => {
    setColors(curr => curr.map(c => {
      if (c.id !== id) return c;
      const arr = [...(c.hexArray || [c.hex])];
      arr[index] = value;
      return { ...c, hexArray: arr, hex: arr[0] };
    }));
  };

  /* ── Gallery helpers for active color ── */
  const activeGallery = colorGalleries[activeColorId] || [];

  const setActiveGallery = (updater) => {
    setColorGalleries(g => ({
      ...g,
      [activeColorId]: typeof updater === 'function' ? updater(g[activeColorId] || []) : updater,
    }));
  };

  const handleGalleryFile = (idx, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setActiveGallery(g => g.map((s, i) => i === idx ? { ...s, file, preview } : s));
  };

  const removeGallerySlot = (idx) => {
    setActiveGallery(g => g.filter((_, i) => i !== idx));
  };

  /* ── Row helpers ── */
  const makeRowHelpers = (setter) => ({
    add:    ()         => setter(r => [...r, { ...EMPTY_SPEC, id: uuid() }]),
    remove: (id)       => setter(r => r.filter(x => x.id !== id)),
    update: (id, k, v) => setter(r => r.map(x => x.id === id ? { ...x, [k]: v } : x)),
  });
  const spec = makeRowHelpers(setSpecifications);
  const mfr  = makeRowHelpers(setManufacturerInfo);
  const hl   = makeRowHelpers(setHighlights);


  // Auto-populate sizes based on product age group
  useEffect(() => {
    if (product?.ageGroup) {
      const derivedSizes = getSizeKeys(product.ageGroup);
      setSizes(derivedSizes);
    }
  }, [product?.ageGroup]);

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate at least one color has at least one image
    const hasImages = colors.some(c => (colorGalleries[c.id] || []).some(s => s.file || s.url));
    if (!hasImages) {
      setError('Please add at least one image for at least one color.');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();

      fd.append('sizes',            JSON.stringify(sizes.filter(Boolean)));
      fd.append('colors',           JSON.stringify(colors.map(({ id, ...rest }) => rest)));
      fd.append('specifications',   JSON.stringify(specifications.map(({ id, ...r }) => r).filter(r => r.label)));
      fd.append('description',      description);
      fd.append('manufacturerInfo', JSON.stringify(manufacturerInfo.map(({ id, ...r }) => r).filter(r => r.label)));
      fd.append('highlights',       JSON.stringify(highlights.map(({ id, ...r }) => r).filter(r => r.label)));
      fd.append('inventory',        JSON.stringify(inventory));

      // Per-color gallery uploads
      colors.forEach(c => {
        const cKey    = colorKey(c.name);
        const gallery = colorGalleries[c.id] || [];
        const existingUrls = [];

        gallery.forEach((slot, i) => {
          if (slot.file) {
            fd.append(`colorImg_${cKey}_${i}`, slot.file);
            existingUrls.push(null);
          } else {
            existingUrls.push(slot.url || null);
          }
        });
        fd.append(`colorGalleryExisting_${cKey}`, JSON.stringify(existingUrls));
      });

      const res  = await fetch(`${API}/product-details/admin/${productId}`, {
        method:  'POST',
        headers: authHdrs(),
        body:    fd,
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Product details saved successfully!');
        pageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        setError(data.message || 'Failed to save.');
      }
    } catch {
      setError('Server error.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pdp-loading">Loading…</div>;

  return (
    <div className="pdp-page" ref={pageRef}>

      {/* Header */}
      <div className="pdp-header">
        <button className="pdp-back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h1 className="pdp-title">Product Details</h1>
          {product && <p className="pdp-subtitle">{product.name}</p>}
        </div>
      </div>

      {error   && <div className="pdp-alert pdp-alert-error">{error}</div>}
      {success && <div className="pdp-alert pdp-alert-success">{success}</div>}

      <form className="pdp-form" onSubmit={handleSubmit}>

        {/* ── TOP PREVIEW GRID ── */}
        <div className="pdp-preview-grid">

          {/* LEFT — Per-color gallery */}
          <div className="pdp-gallery-section">
            <h2 className="pdp-section-title">Product Details</h2>
            <p className="pdp-section-hint">Upload images for each color. First image is the main display image.</p>

            {/* Color tabs */}
            {colors.length > 0 && (
              <div className="pdp-color-tabs">
                {colors.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`pdp-color-tab${activeColorId === c.id ? ' active' : ''}`}
                    onClick={() => setActiveColorId(c.id)}
                  >
                    <span className="pdp-color-tab-dot" style={{ backgroundColor: c.hex }} />
                    {c.name || 'Unnamed'}
                  </button>
                ))}
              </div>
            )}

            {/* Main slot for active color */}
            <div className="pdp-main-slot">
              {activeGallery[0]?.preview ? (
                <div className="pdp-main-preview">
                  <img src={activeGallery[0].preview} alt="Main" />
                  <button type="button" className="pdp-slot-remove" onClick={() => removeGallerySlot(0)}>✕</button>
                </div>
              ) : (
                <label className="pdp-main-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files[0];
                      if (!f) return;
                      if (activeGallery.length === 0) {
                        setActiveGallery(g => [...g, { id: uuid(), file: f, preview: URL.createObjectURL(f), url: null }]);
                      } else {
                        handleGalleryFile(0, f);
                      }
                    }}
                  />
                  <div className="pdp-upload-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="3"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <span className="pdp-upload-text">
                    {activeColorId ? `Upload image for ${colors.find(c => c.id === activeColorId)?.name || 'this color'}` : 'Select a color first'}
                  </span>
                </label>
              )}
            </div>

            {/* Thumbnails row — slots 1-6 for active color */}
            <div className="pdp-thumb-row">
              {Array.from({ length: 6 }).map((_, relIdx) => {
                const absIdx = relIdx + 1;
                const slot   = activeGallery[absIdx];
                return (
                  <div key={absIdx} className="pdp-thumb-slot">
                    {slot?.preview ? (
                      <div className="pdp-thumb-preview">
                        <img src={slot.preview} alt={`Gallery ${absIdx + 1}`} />
                        <button type="button" className="pdp-thumb-remove" onClick={() => removeGallerySlot(absIdx)}>✕</button>
                      </div>
                    ) : (
                      activeGallery.length >= absIdx && activeGallery.length < MAX_GALLERY ? (
                        <label className="pdp-thumb-upload-label">
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const f = e.target.files[0];
                              if (!f) return;
                              if (activeGallery.length <= absIdx) {
                                setActiveGallery(g => [...g, { id: uuid(), file: f, preview: URL.createObjectURL(f), url: null }]);
                              } else {
                                handleGalleryFile(absIdx, f);
                              }
                            }}
                          />
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        </label>
                      ) : (
                        <div className="pdp-thumb-empty" />
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Product info fields */}
          <div className="pdp-right-fields">

            <div className="pdp-field-group">
              <label className="pdp-label">PRODUCT NAME</label>
              <div className="pdp-readonly-value">{product?.name || '—'}</div>
            </div>


            <div className="pdp-field-group">
              <label className="pdp-label">AVAILABLE SIZES</label>
              <p className="pdp-section-hint">Derived from Product Age Group: {product?.ageGroup?.join(', ') || 'None'}</p>
              <div className="pdp-sizes-list">
                <div className="pdp-sizes-readonly-grid">
                  {sizes.length > 0 ? sizes.map(s => (
                    <span key={s} className="pdp-size-tag-readonly">{s}</span>
                  )) : <span className="pdp-section-hint">No sizes available. Check age group.</span>}
                </div>
              </div>
            </div>

            <div className="pdp-field-group">
              <label className="pdp-label">COLORS & PATTERNS</label>
              <p className="pdp-section-hint">Combine multiple color tags for printed or multi-tone dresses.</p>
              <div className="pdp-colors-list">
                {colors.map(c => (
                  <div key={c.id} className="pdp-color-row-wrapper">
                    <div className="pdp-color-row">
                      <div className="pdp-hex-group">
                        {(c.hexArray || [c.hex]).map((h, idx) => (
                          <div key={idx} className="pdp-hex-picker-wrap">
                            <input 
                              type="color" 
                              className="pdp-color-picker" 
                              value={h} 
                              onChange={e => updateHexInArray(c.id, idx, e.target.value)} 
                            />
                            {(c.hexArray || [c.hex]).length > 1 && (
                              <button type="button" className="pdp-hex-remove" onClick={() => removeHexFromColor(c.id, idx)}>×</button>
                            )}
                          </div>
                        ))}
                        {(c.hexArray || [c.hex]).length < 4 && (
                          <button type="button" className="pdp-add-hex-btn" onClick={() => addHexToColor(c.id)} title="Add another color tag">
                            +
                          </button>
                        )}
                      </div>
                      <input 
                        className="pdp-color-name-input" 
                        type="text" 
                        placeholder="Variant name (e.g. Pink Floral)" 
                        value={c.name} 
                        onChange={e => updateColor(c.id, 'name', e.target.value)} 
                      />
                      <button type="button" className="pdp-row-remove" onClick={() => removeColor(c.id)}>✕</button>
                    </div>
                  </div>
                ))}
                <button type="button" className="pdp-add-row-btn" onClick={addColor}>+ Add Color Variant</button>
              </div>
            </div>

            {/* Per-color Stock by Size removed as requested */}
          </div>
        </div>

        {/* ── ACCORDION SECTION ── */}
        <div className="pdp-accordion-section">
          <h2 className="pdp-section-title">Product Details</h2>

          <div className="pdp-accordion-block">
            <h3 className="pdp-accordion-heading">Specifications</h3>
            <div className="pdp-kv-grid pdp-kv-header"><span>Label</span><span>Value</span><span /></div>
            {specifications.map(s => (
              <div key={s.id} className="pdp-kv-grid">
                <input className="pdp-kv-input" placeholder="e.g. Brand" value={s.label} onChange={e => spec.update(s.id, 'label', e.target.value)} />
                <input className="pdp-kv-input" placeholder="e.g. Sumathi Trends" value={s.value} onChange={e => spec.update(s.id, 'value', e.target.value)} />
                <button type="button" className="pdp-row-remove" onClick={() => spec.remove(s.id)}>✕</button>
              </div>
            ))}
            <button type="button" className="pdp-add-row-btn" onClick={spec.add}>+ Add Row</button>
          </div>

          <div className="pdp-accordion-block">
            <h3 className="pdp-accordion-heading">Description</h3>
            <textarea className="pdp-textarea" rows={5} placeholder="Enter product description…" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="pdp-accordion-block">
            <h3 className="pdp-accordion-heading">Manufacturer Info</h3>
            <div className="pdp-kv-grid pdp-kv-header"><span>Label</span><span>Value</span><span /></div>
            {manufacturerInfo.map(s => (
              <div key={s.id} className="pdp-kv-grid">
                <input className="pdp-kv-input" placeholder="e.g. Country of Origin" value={s.label} onChange={e => mfr.update(s.id, 'label', e.target.value)} />
                <input className="pdp-kv-input" placeholder="e.g. India" value={s.value} onChange={e => mfr.update(s.id, 'value', e.target.value)} />
                <button type="button" className="pdp-row-remove" onClick={() => mfr.remove(s.id)}>✕</button>
              </div>
            ))}
            <button type="button" className="pdp-add-row-btn" onClick={mfr.add}>+ Add Row</button>
          </div>

          <div className="pdp-accordion-block">
            <h3 className="pdp-accordion-heading">Product Highlights</h3>
            <div className="pdp-kv-grid pdp-kv-header"><span>Label (e.g. SLEEVE TYPE)</span><span>Value (e.g. Flutter Sleeve)</span><span /></div>
            {highlights.map(h => (
              <div key={h.id} className="pdp-kv-grid">
                <input className="pdp-kv-input" placeholder="e.g. MATERIAL" value={h.label} onChange={e => hl.update(h.id, 'label', e.target.value)} />
                <input className="pdp-kv-input" placeholder="e.g. Pure Organic Cotton" value={h.value} onChange={e => hl.update(h.id, 'value', e.target.value)} />
                <button type="button" className="pdp-row-remove" onClick={() => hl.remove(h.id)}>✕</button>
              </div>
            ))}
            <button type="button" className="pdp-add-row-btn" onClick={hl.add}>+ Add Row</button>
          </div>
        </div>

        <div className="pdp-form-actions">
          <button type="button" className="pdp-cancel-btn" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="pdp-save-btn" disabled={saving}>{saving ? 'Saving…' : 'Save Details'}</button>
        </div>

      </form>
    </div>
  );
}
