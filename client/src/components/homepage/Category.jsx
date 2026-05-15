import { useNavigate } from 'react-router-dom';
import '../../styles/homepage/Category.css';

const categories = [
  {
    label: 'OCCASION & DAILY\nWEAR FROCKS',
    img: '/images/Shopcategory/1776775593503_2714.png',
    path: '/collections/occasion-daily-wear-frocks',
  },
  {
    label: 'PARTY WEAR\nCOLLECTION',
    img: '/images/Shopcategory/1776776431599_6458.png',
    path: '/collections/party-wear-collection',
  },
  {
    label: 'TRADITIONAL & ETHNIC\nFROCKS',
    img: '/images/Shopcategory/1776840584537_4076.png',
    path: '/collections/traditional-ethnic-frocks',
  },
  {
    label: 'DESIGNER & PREMIUM\nFROCKS',
    img: '/images/Shopcategory/1776841373963_8759.png',
    path: '/collections/designer-premium-frocks',
  },
  {
    label: 'FABRIC-BASED\nCATEGORIES',
    img: '/images/Shopcategory/1776846610509_5753.png',
    path: '/collections/fabric-based-categories',
  },
];

export default function Category() {
  const navigate = useNavigate();

  return (
    <section id="collections" className="category-section">
      <div className="section-inner">

        <div className="category-header">
          <h2 className="category-title">
            <span>Shop By</span> Category
          </h2>
          <p className="category-subtitle">
            Discover beautiful styles for every occasion and every little moment.
          </p>
        </div>

        <div className="category-grid">
          {categories.map((cat) => (
            <div
              key={cat.label}
              className="category-card"
              onClick={() => navigate(cat.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(cat.path)}
            >
              <div className="category-circle">
                <img src={cat.img} alt={cat.label} />
              </div>

              <span className="category-label">
                {cat.label.split('\n').map((line, i) => (
                  <span key={i} style={{ display: 'block' }}>
                    {line}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
