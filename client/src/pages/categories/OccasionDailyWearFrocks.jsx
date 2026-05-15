import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import '../../styles/homepage/Category.css';

const subcategories = [
  { label: 'Birthday Party Frocks', img: '/images/OccasionDailyWearFrocks/1776776135077_3807.png' },
  { label: 'Wedding / Festive Frocks', img: '/images/OccasionDailyWearFrocks/1776776302914_4917.png' },
  { label: 'Reception / Evening Wear', img: '/images/OccasionDailyWearFrocks/1776776431599_6458.png' },
  { label: 'Photoshoot Special Frocks', img: '/images/OccasionDailyWearFrocks/1776780536094_5132.png' },
  { label: 'Princess / Fancy Dress', img: '/images/OccasionDailyWearFrocks/1776782149108_3022.png' },
  { label: 'Casual Cotton Frocks', img: '/images/OccasionDailyWearFrocks/1776840584537_4076.png' },
  { label: 'Playtime Frocks', img: '/images/OccasionDailyWearFrocks/1776841105993_3141.png' },
  { label: 'School Casual Frocks', img: '/images/OccasionDailyWearFrocks/1776841373963_8759.png' },
  { label: 'Summer Wear Frocks', img: '/images/OccasionDailyWearFrocks/1776842765654_8317.png' },
  { label: 'Comfortable Home Wear', img: '/images/OccasionDailyWearFrocks/1776843068284_4169.png' },
];

export default function OccasionDailyWearFrocks() {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  const navigate = useNavigate();

  return (
    <div className="catpage-wrapper">
      <SEO 
        title="Occasion & Daily Wear Kids Frocks Bangalore | 0-12 Years"
        description="Best kids occasion and daily wear frocks in Bangalore, Karnataka. Sumathi Trends offers premium birthday party frocks, festive wear, and comfortable daily outfits for ages 0-12."
        keywords="kids occasion wear Bangalore, daily wear frocks Bangalore Karnataka, 0-12 years kids clothes, best kids clothing Bangalore"
        url="https://sumathitrends.com/collections/occasion-daily-wear-frocks"
      />


      <h1 className="catpage-title">Occasion &amp; Daily Wear Frocks</h1>
      <div className="catpage-divider" />

      <div className="catpage-grid">
        {subcategories.map((item) => (
          <div
            key={item.label}
            className="catpage-card"
            onClick={() => navigate('/collections', { state: { category: 'Occasion & Daily Wear Frocks', subcategory: item.label } })}
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
