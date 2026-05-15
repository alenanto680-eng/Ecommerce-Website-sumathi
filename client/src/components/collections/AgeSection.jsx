import { useNavigate, Link, useLocation } from 'react-router-dom';
import '../../styles/collections/AgeSection.css';

const ageGroups = [
  {
    slug: 'newborn',
    label: 'Newborn',
    range: '0–6 Months',
    img: '/images/collections/newborn.avif',
  },
  {
    slug: 'infant',
    label: 'Infant',
    range: '6–12 Months',
    img: '/images/collections/Infant.webp',
  },
  {
    slug: 'toddler',
    label: 'Toddler',
    range: '1–3 Years',
    img: '/images/collections/Toddler.webp',
  },
  {
    slug: 'little-girls',
    label: 'Little Girls',
    range: '3–6 Years',
    img: '/images/collections/Little Girls.jpg',
  },
  {
    slug: 'kids',
    label: 'Kids',
    range: '6–9 Years',
    img: '/images/collections/Kids.webp',
  },
  {
    slug: 'pre-teen',
    label: 'Pre-Teen',
    range: '9–12 Years',
    img: '/images/collections/Pre-Teen.webp',
  },
];

export default function AgeSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { category, subcategory } = location.state || {};

  return (
    <section id="age-sections" className="age-section">
      <div className="section-inner">

        {/* Breadcrumb */}
        <div className="page-breadcrumb">
          <Link to="/" className="breadcrumb-link" onClick={() => sessionStorage.setItem('goHome', '1')}>Home</Link>
          {subcategory ? (
            <>
              <span className="breadcrumb-sep"> › </span>
              <Link to="/" onClick={() => sessionStorage.setItem('scrollTarget', 'collections')} className="breadcrumb-link">Category</Link>
              <span className="breadcrumb-sep"> › </span>
              <span className="breadcrumb-current">{subcategory}</span>
            </>
          ) : (
            <>
              <span className="breadcrumb-sep"> › </span>
              <span className="breadcrumb-current">Collections</span>
            </>
          )}
        </div>

        <div className="age-grid">
          {ageGroups.map((group) => (
            <div
              key={group.slug}
              className="age-card"
              onClick={() => navigate(`/collections/${group.slug}`)}
            >
              <img
                src={group.img}
                alt={group.range}
                className="age-card-img"
              />
              <div className="age-card-overlay" />
              <div className="age-card-info">
                <span className="age-card-label">{group.label}</span>
                <span className="age-card-range">{group.range}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
