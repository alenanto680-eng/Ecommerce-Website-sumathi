import { useState } from 'react';
import '../../styles/collectiondetails/ProductAccordion.css';

const ALL_DETAILS_TABS = ['Specifications', 'Description', 'Manufacturer info'];

const ChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export default function ProductAccordion({
  specifications   = [],
  description      = '',
  manufacturerInfo = [],
  highlights       = [],
}) {
  const [openSection, setOpenSection] = useState(null);
  const [detailTab,   setDetailTab]   = useState('Specifications');

  const toggle = (id) => setOpenSection(openSection === id ? null : id);

  return (
    <div className="pa-wrapper">

      {/* All details */}
      <div className={`pa-item${openSection === 'details' ? ' open' : ''}`}>
        <button className="pa-header" onClick={() => toggle('details')}>
          <span>All details</span>
          <span className="pa-chevron">
            {openSection === 'details' ? <ChevronUp /> : <ChevronDown />}
          </span>
        </button>

        {openSection === 'details' && (
          <div className="pa-body">
            <div className="pa-tabs">
              {ALL_DETAILS_TABS.map(t => (
                <button
                  key={t}
                  className={`pa-tab${detailTab === t ? ' active' : ''}`}
                  onClick={() => setDetailTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {detailTab === 'Specifications' && (
              <div className="pa-spec-section">
                <p className="pa-spec-group-label">General</p>
                <div className="pa-spec-grid">
                  {specifications.map((s, i) => (
                    <div key={i} className="pa-spec-cell">
                      <p className="pa-spec-label">{s.label}</p>
                      <p className="pa-spec-value">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailTab === 'Description' && (
              <p className="pa-desc-text">{description}</p>
            )}

            {detailTab === 'Manufacturer info' && (
              <div className="pa-mfr-grid">
                {manufacturerInfo.map((s, i) => (
                  <div key={i} className="pa-spec-cell">
                    <p className="pa-spec-label">{s.label}</p>
                    <p className="pa-spec-value">{s.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product highlights */}
      <div className={`pa-item${openSection === 'highlights' ? ' open' : ''}`}>
        <button className="pa-header" onClick={() => toggle('highlights')}>
          <span>Product highlights</span>
          <span className="pa-chevron">
            {openSection === 'highlights' ? <ChevronUp /> : <ChevronDown />}
          </span>
        </button>
        {openSection === 'highlights' && (
          <div className="pa-body">
            <div className="pa-highlights-grid">
              {highlights.map((r, i) => (
                <div key={i} className="pa-highlight-cell">
                  <p className="pa-hl-label">{r.label}</p>
                  <p className="pa-hl-value">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
