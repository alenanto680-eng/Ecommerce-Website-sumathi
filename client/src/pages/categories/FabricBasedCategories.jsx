import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import '../../styles/homepage/Category.css';

const subcategories = [
  { label: 'Cotton Frocks', img: '/images/FabricBasedCategories/1776775593503_2714.png' },
  { label: 'Net Frocks', img: '/images/FabricBasedCategories/1776775833065_3851.png' },
  { label: 'Satin Frocks', img: '/images/FabricBasedCategories/1776843299285_5674.png' },
  { label: 'Silk Frocks', img: '/images/FabricBasedCategories/1776844222010_3728.png' },
  { label: 'Organza Frocks', img: '/images/FabricBasedCategories/1776846610510_8598.png' },
  { label: 'Velvet Frocks (Winter Special)', img: '/images/FabricBasedCategories/1776846709968_2656.png' },
];

export default function FabricBasedCategories() {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  const navigate = useNavigate();

  return (
    <div className="catpage-wrapper">
      <SEO 
        title="Fabric-Based Kids Clothing Bangalore | 0-12 Years"
        description="Discover kids clothing by material in Bangalore, Karnataka. Sumathi Trends offers cotton, silk, organza, and velvet frocks for ages 0-12."
        keywords="cotton kids wear Bangalore, silk frocks Bangalore Karnataka, 0-12 years organza frocks, velvet kids wear Bangalore, fabric based kids clothing Bangalore"
        url="https://sumathitrends.com/collections/fabric-based-categories"
      />


      <h1 className="catpage-title">Fabric-Based Categories</h1>
      <div className="catpage-divider" />

      <div className="catpage-grid">
        {subcategories.map((item) => (
          <div
            key={item.label}
            className="catpage-card"
            onClick={() => navigate('/collections', { state: { category: 'Fabric-Based Categories', subcategory: item.label } })}
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
