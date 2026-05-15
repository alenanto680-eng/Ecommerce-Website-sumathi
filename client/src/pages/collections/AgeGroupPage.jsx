import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AgeGroupBanner from '../../components/collections/AgeGroupBanner';
import FilterSidebar from '../../components/collections/FilterSidebar';
import ProductGrid from '../../components/collections/ProductGrid';
import SEO from '../../components/SEO';
import '../../styles/collections/AgeGroupPage.css';

const AGE_META = {
  newborn: { label: "Newborn", range: '0–6 Months' },
  infant: { label: "Infant", range: '6–12 Months' },
  toddler: { label: "Toddler", range: '1–3 Years' },
  'little-girls': { label: "Little Girls", range: '3–6 Years' },
  kids: { label: "Kids", range: '6–9 Years' },
  'pre-teen': { label: "Pre-Teen", range: '9–12 Years' },
};

const SORT_OPTIONS = ['Newest Arrivals', 'Price: Low to High', 'Price: High to Low', 'Best Rated'];

const MIN_PRICE = 0;
const MAX_PRICE = 3000;

export default function AgeGroupPage() {
  const { ageGroup } = useParams();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [ageGroup]);

  const meta = AGE_META[ageGroup] || AGE_META.newborn;

  // ── Filter state (all owned here, passed to both sidebar + grid) ──
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [priceMin, setPriceMin] = useState(MIN_PRICE);
  const [priceMax, setPriceMax] = useState(MAX_PRICE);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [sustainableOnly, setSustainableOnly] = useState(false);
  const [sortBy, setSortBy] = useState('Newest Arrivals');

  // ── Section open/close state ──
  const [open, setOpen] = useState({
    color: true, price: true, ratings: true, category: false,
  });

  const handleReset = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setPriceMin(MIN_PRICE);
    setPriceMax(MAX_PRICE);
    setSelectedRatings([]);
    setSustainableOnly(false);
  };

  return (
    <main className="agp-page">
      <SEO 
        title={`${meta.label} Clothing (${meta.range})`}
        description={`Shop premium clothing for ${meta.label.toLowerCase()} aged ${meta.range}. Comfortable, stylish, and high-quality collection at Sumathi Trends.`}
        keywords={`${meta.label.toLowerCase()} clothes, kids aged ${meta.range}, children fashion ${meta.label.toLowerCase()}, Sumathi Trends ${meta.label.toLowerCase()}`}
        url={`https://sumathitrends.com/collections/${ageGroup}`}
      />
      <AgeGroupBanner meta={meta} />

      <div className="section-inner">


        <div className="agp-layout">
          <FilterSidebar
            selectedColors={selectedColors} setSelectedColors={setSelectedColors}
            selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
            priceMin={priceMin} setPriceMin={setPriceMin}
            priceMax={priceMax} setPriceMax={setPriceMax}
            selectedRatings={selectedRatings} setSelectedRatings={setSelectedRatings}
            open={open} setOpen={setOpen}
            onReset={handleReset}
          />

          <div className="agp-right">
            <div className="agp-toolbar" style={{ justifyContent: 'flex-end' }}>
              <div className="agp-sort">
                <span>Sort by:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <ProductGrid
              ageGroup={ageGroup}
              selectedCategories={selectedCategories}
              selectedColors={selectedColors}
              priceMin={priceMin}
              priceMax={priceMax}
              selectedRatings={selectedRatings}
              sustainableOnly={sustainableOnly}
              sortBy={sortBy}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
