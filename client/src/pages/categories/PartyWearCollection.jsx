import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import '../../styles/homepage/Category.css';

const subcategories = [
  { label: 'Net Frocks', img: '/images/PartyWearCollection/1776775593503_2714.png' },
  { label: 'Gown Style Frocks', img: '/images/PartyWearCollection/1776775833065_3851.png' },
  { label: 'Layered / Frill Frocks', img: '/images/PartyWearCollection/1776776135077_3807.png' },
  { label: 'Sequin / Glitter Frocks', img: '/images/PartyWearCollection/1776776302914_4917.png' },
  { label: 'Princess Frocks', img: '/images/PartyWearCollection/1776776431599_6458.png' },
  { label: 'Satin / Silk Dress', img: '/images/PartyWearCollection/1776782149108_3022.png' },
  { label: 'Velvet Frocks', img: '/images/PartyWearCollection/1776841373963_8759.png' },
  { label: 'Floral Embellished Frocks', img: '/images/PartyWearCollection/1776843068284_4169.png' },
  { label: 'Indo-Western Party Gowns', img: '/images/PartyWearCollection/1776843299285_5674.png' },
  { label: 'High-Low Frocks', img: '/images/PartyWearCollection/1776844222010_3728.png' },
];

export default function PartyWearCollection() {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  const navigate = useNavigate();

  return (
    <div className="catpage-wrapper">
      <SEO 
        title="Party Wear Kids Collection Bangalore | 0-12 Years"
        description="Best kids party wear collection in Bangalore, Karnataka. Discover stunning net frocks, gown styles, and sequin dresses for ages 0-12 at Sumathi Trends."
        keywords="kids party wear Bangalore, party frocks Bangalore Karnataka, 0-12 years party wear, best kids clothing Bangalore"
        url="https://sumathitrends.com/collections/party-wear-collection"
      />


      <h1 className="catpage-title">Party Wear Collection</h1>
      <div className="catpage-divider" />

      <div className="catpage-grid">
        {subcategories.map((item) => (
          <div
            key={item.label}
            className="catpage-card"
            onClick={() => navigate('/collections', { state: { category: 'Party Wear Collection', subcategory: item.label } })}
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
