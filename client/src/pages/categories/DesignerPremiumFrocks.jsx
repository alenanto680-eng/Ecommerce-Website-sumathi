import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import '../../styles/homepage/Category.css';

const subcategories = [
  {
    label: 'Boutique Designer Frocks',
    img: '/images/DesignerPremiumFrocks/1776775607339_8482.png'
  },
  {
    label: 'Handwork / Embroidery Frocks',
    img: '/images/DesignerPremiumFrocks/1776776431599_6458.png'
  },
  {
    label: 'Custom Made Frocks',
    img: '/images/DesignerPremiumFrocks/1776782149108_3022.png'
  },
  {
    label: 'Luxury Collection',
    img: '/images/DesignerPremiumFrocks/1776840584537_4076.png'
  },
];

export default function DesignerPremiumFrocks() {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  const navigate = useNavigate();

  return (
    <div className="catpage-wrapper">
      <SEO 
        title="Designer & Premium Kids Frocks Bangalore | 0-12 Years"
        description="Shop the best designer and premium kids frocks in Bangalore, Karnataka. Exclusive boutique collections and custom-made luxury frocks for ages 0-12 at Sumathi Trends."
        keywords="designer kids frocks Bangalore, boutique kids wear Bangalore, 0-12 years luxury frocks, premium kids clothing Bangalore"
        url="https://sumathitrends.com/collections/designer-premium-frocks"
      />


      <h1 className="catpage-title">Designer &amp; Premium Frocks</h1>
      <div className="catpage-divider" />

      <div className="catpage-grid">
        {subcategories.map((item) => (
          <div
            key={item.label}
            className="catpage-card"
            onClick={() => navigate('/collections', { state: { category: 'Designer & Premium Frocks', subcategory: item.label } })}
          >
            <div className="catpage-img-wrap">
              <img src={item.img} alt={item.label} />
            </div>
            <p className="catpage-label">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
