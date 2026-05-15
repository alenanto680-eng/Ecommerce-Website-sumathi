import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FilterSidebar from '../../components/collections/FilterSidebar';
import ProductGrid from '../../components/collections/ProductGrid';
import SEO from '../../components/SEO';
import '../../styles/collections/CollectionsPage.css';

const SORT_OPTIONS = ['Newest Arrivals', 'Price: Low to High', 'Price: High to Low', 'Best Rated'];
const MIN_PRICE = 0;
const MAX_PRICE = 3000;

export default function CollectionsPage() {
  const location = useLocation();
  const { category, subcategory, ageGroup } = location.state || {};

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // ── Filter states ──
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const cats = [];
    if (category) cats.push(category);
    return cats;
  });
  const [selectedSubcategories, setSelectedSubcategories] = useState(() => {
    return subcategory ? [subcategory] : [];
  });
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState(ageGroup ? [ageGroup] : []);
  const [priceMin, setPriceMin] = useState(MIN_PRICE);
  const [priceMax, setPriceMax] = useState(MAX_PRICE);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [sortBy, setSortBy] = useState('Newest Arrivals');
  const [productCount, setProductCount] = useState(0);

  // Sync state from location.state when navigating (e.g. from breadcrumbs/navbar)
  // This ensures "Clicking Collections" actually resets the view
  useEffect(() => {
    const { category: stCat, subcategory: stSub, ageGroup: stAge } = location.state || {};

    setSelectedCategories(stCat ? [stCat] : []);
    setSelectedSubcategories(stSub ? [stSub] : []);
    setSelectedAgeGroups(stAge ? [stAge] : []);

    // Clear secondary filters on major navigation
    setSelectedColors([]);
    setPriceMin(MIN_PRICE);
    setPriceMax(MAX_PRICE);
    setSelectedRatings([]);
  }, [location.state]);

  // ── Sidebar section toggle state ──
  const [open, setOpen] = useState({
    color: true, price: true, ratings: true, category: true, subcategory: true, age: true
  });

  const handleReset = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedColors([]);
    setSelectedAgeGroups([]);
    setPriceMin(MIN_PRICE);
    setPriceMax(MAX_PRICE);
    setSelectedRatings([]);
  };

  return (
    <main className="collections-page">
      <SEO 
        title="Our Collections"
        description="Explore our wide range of premium kids clothing, from daily wear frocks to designer party wear. Quality fashion for all ages 0-12."
        keywords="kids collections, children frocks, designer kids wear, party wear for girls, ethnic wear kids, Sumathi Trends catalog"
        url="https://sumathitrends.com/collections"
      />
      <div className="section-inner">
        {/* Breadcrumb - reduced gap */}




        <div className="agp-layout" style={{ marginTop: '0px', marginBottom: '60px' }}>
          <FilterSidebar
            selectedColors={selectedColors} setSelectedColors={setSelectedColors}
            availableColors={availableColors}
            selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
            selectedSubcategories={selectedSubcategories} setSelectedSubcategories={setSelectedSubcategories}
            selectedAgeGroups={selectedAgeGroups} setSelectedAgeGroups={setSelectedAgeGroups}
            priceMin={priceMin} setPriceMin={setPriceMin}
            priceMax={priceMax} setPriceMax={setPriceMax}
            selectedRatings={selectedRatings} setSelectedRatings={setSelectedRatings}
            open={open} setOpen={setOpen}
            onReset={handleReset}
          />

          <div className="agp-right">
            <div className="agp-toolbar">
              <h2 className="agp-gallery-title" style={{ margin: 0, fontWeight: '700', color: '#1A1A1A' }}>
                All Products <span style={{ color: '#9CA3AF', fontWeight: '400' }}>({productCount})</span>
              </h2>
              <div className="agp-sort">
                <span>Sort by:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <ProductGrid
              selectedCategories={selectedCategories}
              selectedSubcategories={selectedSubcategories}
              selectedColors={selectedColors}
              selectedAgeGroups={selectedAgeGroups}
              priceMin={priceMin}
              priceMax={priceMax}
              selectedRatings={selectedRatings}
              sortBy={sortBy}
              onCountUpdate={setProductCount}
              onColorsUpdate={setAvailableColors}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
