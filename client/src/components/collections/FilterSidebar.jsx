import '../../styles/collections/FilterSidebar.css';

const RATINGS = [5, 4, 3, 2, 1];

const CATEGORIES = [
  'Occasion & Daily Wear Frocks',
  'Party Wear Collection',
  'Designer & Premium Frocks',
  'Traditional & Ethnic Frocks',
  'Fabric-Based Categories'
];

const SUBCATEGORIES_MAP = {
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

const AGE_GROUPS = [
  { slug: 'newborn',      label: 'Newborn (0-6M)' },
  { slug: 'infant',       label: 'Infant (6-12M)' },
  { slug: 'toddler',      label: 'Toddler (1-3Y)' },
  { slug: 'little-girls', label: 'Little Girls (3-6Y)' },
  { slug: 'kids',         label: 'Kids (6-9Y)' },
  { slug: 'pre-teen',     label: 'Pre-Teen (9-12Y)' },
];

const MIN_PRICE = 0;
const MAX_PRICE = 3000;

function Stars({ count }) {
  return (
    <span className="fs-stars">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i <= count ? '#F59E0B' : '#E5E7EB'}
          stroke={i <= count ? '#F59E0B' : '#D1D5DB'}
          strokeWidth="1">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  );
}

function Chevron({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {open ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
    </svg>
  );
}

export default function FilterSidebar({
  selectedColors = [],      setSelectedColors = () => {},
  availableColors = [],
  selectedCategories = [],  setSelectedCategories = () => {},
  selectedSubcategories = [], setSelectedSubcategories = () => {},
  selectedAgeGroups = [],    setSelectedAgeGroups = () => {},
  priceMin = MIN_PRICE,     setPriceMin = () => {},
  priceMax = MAX_PRICE,     setPriceMax = () => {},
  selectedRatings = [],     setSelectedRatings = () => {},
  open = {},                setOpen = () => {},
  onReset = () => {},
}) {
  const toggleSection = (k) => setOpen(p => ({ ...p, [k]: !p[k] }));
  const toggleItem = (val, arr, setArr) =>
    setArr(p => p.includes(val) ? p.filter(v => v !== val) : [...p, val]);

  const minPct = ((priceMin - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const maxPct = ((priceMax - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  return (
    <aside className="filter-sidebar">
      <div className="filter-header">
        <div className="filter-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filter
        </div>
        <button className="filter-reset" onClick={() => { 
          onReset();
          setSelectedAgeGroups([]); 
        }}>Reset</button>
      </div>

      {/* Age Group */}
      <div className="filter-group">
        <div className="filter-group-header" onClick={() => toggleSection('age')}>
          <span>Age Group</span><Chevron open={open.age} />
        </div>
        {open.age && (
          <ul className="filter-list">
            {AGE_GROUPS.map(g => (
              <li key={g.slug}>
                <label className="filter-checkbox-label">
                  <input type="checkbox" checked={selectedAgeGroups.includes(g.slug)}
                    onChange={() => toggleItem(g.slug, selectedAgeGroups, setSelectedAgeGroups)}
                    className="filter-checkbox" />
                  <span className={"filter-label-text" + (selectedAgeGroups.includes(g.slug) ? ' active' : '')}>{g.label}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Color */}
      <div className="filter-group">
        <div className="filter-group-header" onClick={() => toggleSection('color')}>
          <span>Color</span><Chevron open={open.color} />
        </div>
        {open.color && (
          <div className="filter-colors">
            {availableColors.map(c => (
              <button key={c.name}
                className={"color-dot" + (selectedColors.includes(c.name) ? ' active' : '')}
                style={{ backgroundColor: c.hex }}
                onClick={() => toggleItem(c.name, selectedColors, setSelectedColors)}
                title={c.name} />
            ))}
          </div>
        )}
      </div>

      {/* Price */}
      <div className="filter-group">
        <div className="filter-group-header" onClick={() => toggleSection('price')}>
          <span>Price</span><Chevron open={open.price} />
        </div>
        {open.price && (
          <div className="fs-price">
            <div className="fs-range-wrap">
              <div className="fs-range-track-bg" />
              <div className="fs-range-fill" style={{ left: minPct + '%', width: (maxPct - minPct) + '%' }} />
              <input type="range" min={MIN_PRICE} max={MAX_PRICE} value={priceMin}
                onChange={e => setPriceMin(Math.min(Number(e.target.value), priceMax - 100))}
                className="fs-range fs-range-min" />
              <input type="range" min={MIN_PRICE} max={MAX_PRICE} value={priceMax}
                onChange={e => setPriceMax(Math.max(Number(e.target.value), priceMin + 100))}
                className="fs-range fs-range-max" />
            </div>
            <div className="fs-price-labels">
              <span>&#8377;{priceMin.toLocaleString()}</span>
              <span>&#8377;{priceMax.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Customer Ratings */}
      <div className="filter-group">
        <div className="filter-group-header" onClick={() => toggleSection('ratings')}>
          <span>Customer Ratings</span><Chevron open={open.ratings} />
        </div>
        {open.ratings && (
          <div className="fs-ratings-grid">
            {RATINGS.map(r => (
              <label key={r} className="filter-checkbox-label">
                <input type="checkbox" checked={selectedRatings.includes(r)}
                  onChange={() => toggleItem(r, selectedRatings, setSelectedRatings)}
                  className="filter-checkbox" />
                <Stars count={r} />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Category */}
      <div className="filter-group">
        <div className="filter-group-header" onClick={() => toggleSection('category')}>
          <span>Category</span><Chevron open={open.category} />
        </div>
        {open.category && (
          <ul className="filter-list">
            {CATEGORIES.map(cat => (
              <li key={cat}>
                <label className="filter-checkbox-label">
                  <input type="checkbox" checked={selectedCategories.includes(cat)}
                    onChange={() => {
                      toggleItem(cat, selectedCategories, setSelectedCategories);
                      // Optimization: If unchecking category, we could clear its subcategories
                      // but showing specific subcategories based on selection is handled in rendering
                    }}
                    className="filter-checkbox" />
                  <span className={"filter-label-text" + (selectedCategories.includes(cat) ? ' active' : '')}>{cat}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Sub Categories - Dependent on selected categories */}
      {selectedCategories.length > 0 && (
        <div className="filter-group">
          <div className="filter-group-header" onClick={() => toggleSection('subcategory')}>
            <span>Sub Categories</span><Chevron open={open.subcategory} />
          </div>
          {open.subcategory && (
            <ul className="filter-list">
              {selectedCategories.flatMap(cat => SUBCATEGORIES_MAP[cat] || []).map(sub => (
                <li key={sub}>
                  <label className="filter-checkbox-label">
                    <input type="checkbox" checked={selectedSubcategories.includes(sub)}
                      onChange={() => toggleItem(sub, selectedSubcategories, setSelectedSubcategories)}
                      className="filter-checkbox" />
                    <span className={"filter-label-text" + (selectedSubcategories.includes(sub) ? ' active' : '')}>{sub}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}
