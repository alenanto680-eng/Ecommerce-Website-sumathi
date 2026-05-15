import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import '../../styles/homepage/Category.css';

const subcategories = [
  { label: 'Pattu Pavadai (Silk Frocks)', img: '/images/TraditionalEthnicFrocks/1776775833065_3851.png' },
  { label: 'Banarasi Silk Frocks', img: '/images/TraditionalEthnicFrocks/1776776102246_3413.png' },
  { label: 'Lehenga Choli Frocks', img: '/images/TraditionalEthnicFrocks/1776776302914_4917.png' },
  { label: 'Anarkali Style Frocks', img: '/images/TraditionalEthnicFrocks/1776776431599_6458.png' },
  { label: 'Cotton Ethnic Frocks', img: '/images/TraditionalEthnicFrocks/1776782149108_3022.png' },
  { label: 'Indo-Western Fusion Frocks', img: '/images/TraditionalEthnicFrocks/1776840584537_4076.png' },
  { label: 'Gota Patti / Zari Work Frocks', img: '/images/TraditionalEthnicFrocks/1776841373963_8759.png' },
  { label: 'Kalamkari / Block Print Frocks', img: '/images/TraditionalEthnicFrocks/1776843068284_4169.png' },
  { label: 'Dhoti Style Frocks', img: '/images/TraditionalEthnicFrocks/1776844222010_3728.png' },
  { label: 'Half-Saree Style Frocks', img: '/images/TraditionalEthnicFrocks/1776846709968_2656.png' },
];

export default function TraditionalEthnicFrocks() {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  const navigate = useNavigate();

  return (
    <div className="catpage-wrapper">
      <SEO 
        title="Traditional & Ethnic Kids Frocks Bangalore | 0-12 Years"
        description="Best traditional and ethnic kids frocks in Bangalore, Karnataka. Shop authentic Pattu Pavadai, Banarasi silk, and Lehenga Choli for ages 0-12 at Sumathi Trends."
        keywords="traditional kids wear Bangalore, ethnic kids wear Karnataka, 0-12 years ethnic wear, Pattu Pavadai Bangalore, best kids clothing Bangalore"
        url="https://sumathitrends.com/collections/traditional-ethnic-frocks"
      />


      <h1 className="catpage-title">Traditional &amp; Ethnic Frocks</h1>
      <div className="catpage-divider" />

      <div className="catpage-grid">
        {subcategories.map((item) => (
          <div
            key={item.label}
            className="catpage-card"
            onClick={() => navigate('/collections', { state: { category: 'Traditional & Ethnic Frocks', subcategory: item.label } })}
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
