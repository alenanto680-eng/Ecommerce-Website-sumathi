import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import '../../styles/collections/ProductGrid.css';

const Stars = ({ rating, reviews }) => (
  <div className="pg-stars">
    <span className="pg-stars-filled">{'★'.repeat(Math.floor(rating))}</span>
    <span className="pg-stars-empty">{'☆'.repeat(5 - Math.floor(rating))}</span>
    <span className="pg-reviews">({reviews})</span>
  </div>
);

const toSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const toAgeGroup = (age) => {
  if (age === '0-2Y') return 'newborn';
  if (age === '3-6Y') return 'toddler';
  return 'junior';
};

export default function ProductGrid({ 
  ageGroup, 
  propProducts, 
  onCountUpdate = () => {},
  onColorsUpdate = () => {},
  selectedCategories = [], 
  selectedSubcategories = [],
  selectedColors = [], 
  selectedAgeGroups = [],
  priceMin,
  priceMax,
  selectedRatings = [],
  sustainableOnly = false, 
  sortBy = 'Newest Arrivals' 
}) {
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [apiProducts, setApiProducts] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const PAGE_SIZE = 15;
  const gridTopRef = useRef(null);
  const lastFiltersRef = useRef();

  // ── Reset page when filters change ──
  useEffect(() => {
    const currentFilters = JSON.stringify({
      selectedCategories, 
      selectedSubcategories, 
      selectedColors, 
      selectedAgeGroups, 
      priceMin, 
      priceMax, 
      selectedRatings, 
      sortBy
    });

    if (lastFiltersRef.current && lastFiltersRef.current !== currentFilters) {
      setSearchParams(prev => {
        prev.set('page', '1');
        return prev;
      }, { replace: true });
    }
    lastFiltersRef.current = currentFilters;
  }, [
    selectedCategories, 
    selectedSubcategories, 
    selectedColors, 
    selectedAgeGroups, 
    priceMin, 
    priceMax, 
    selectedRatings, 
    sortBy,
    setSearchParams
  ]);

  useEffect(() => {
    if (propProducts) return;
    const fetchFromAPI = async () => {
      try {
        let url = '/api/products';
        const params = new URLSearchParams();
        
        if (ageGroup) {
          params.append('ageGroup', ageGroup);
        } else if (selectedAgeGroups.length > 0) {
          params.append('ageGroup', selectedAgeGroups.join(','));
        }
        
        const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;
        const res = await fetch(finalUrl);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setApiProducts(data.data);
        } else {
          setApiProducts([]);
        }
      } catch {
        setApiProducts([]);
      }
    };
    fetchFromAPI();
  }, [ageGroup, selectedAgeGroups, propProducts]);

  let base;
  if (propProducts) {
    base = propProducts;
  } else if (apiProducts === null) {
    base = [];
  } else {
    base = apiProducts;
  }

  let filtered = [...base];

  // 1. Category & Subcategory Filter
  if (selectedCategories.length > 0) {
    filtered = filtered.filter(p => {
      const pCats = (Array.isArray(p.category) ? p.category : [p.category]).map(c => c.trim());
      
      const matchCat = pCats.some(c => {
        if (selectedCategories.includes(c)) return true;
        // Fallback for combined/split names
        if (selectedCategories.includes('Occasion & Daily Wear Frocks')) {
          if (c === 'Occasion Wear Frocks' || c === 'Daily Wear Frocks') return true;
        }
        if (c === 'Occasion & Daily Wear Frocks') {
          if (selectedCategories.includes('Occasion Wear Frocks') || selectedCategories.includes('Daily Wear Frocks')) return true;
        }
        return false;
      });
      
      if (selectedSubcategories.length > 0) {
        // Match either in the 'subCategory' (backend field) or 'category' array
        const pSubCats = (Array.isArray(p.subCategory) ? p.subCategory : [p.subCategory]).map(s => s.trim());
        const matchSub = pSubCats.some(s => selectedSubcategories.includes(s)) || pCats.some(c => selectedSubcategories.includes(c));
        return matchCat && matchSub;
      }
      return matchCat;
    });
  }

  // 2. Color Filter
  if (selectedColors.length > 0) {
    const normalizedSelected = selectedColors.map(c => c.toLowerCase().trim());
    filtered = filtered.filter(p => 
      p.colors && Array.isArray(p.colors) && p.colors.some(c => {
        const variantName = (c.name || '').toLowerCase();
        // Split variant names like "Red & Blue" or "Pink / White" to check individual components
        const parts = variantName.split(/[\/,&\-]+/).map(s => s.trim()).filter(Boolean);
        return parts.some(part => normalizedSelected.includes(part)) || normalizedSelected.includes(variantName);
      })
    );
  }

  // 3. Price Filter
  if (priceMin !== undefined && priceMax !== undefined) {
    filtered = filtered.filter(p => p.price >= priceMin && p.price <= priceMax);
  }

  // 4. Ratings Filter
  if (selectedRatings.length > 0) {
    filtered = filtered.filter(p => {
      const floorRating = Math.floor(p.stars || 0);
      return selectedRatings.includes(floorRating);
    });
  }

  // 5. Sustainability Filter
  if (sustainableOnly) filtered = filtered.filter(p => p.sustainability);

  // 6. Sorting
  // 6. Primary Sort: Stock Status (In-stock first), then Secondary Sort: User Selection
  filtered.sort((a, b) => {
    const aStock = Number(a.stock) || 0;
    const bStock = Number(b.stock) || 0;
    const aOut = aStock <= 0;
    const bOut = bStock <= 0;

    // Phase 1: Out of stock always goes to the bottom
    if (aOut !== bOut) {
      return aOut ? 1 : -1;
    }

    // Phase 2: If both have same stock status, use the secondary sort (sortBy)
    if (sortBy === 'Price: Low to High') {
      return parseFloat(String(a.price).replace(/[^\d.]/g, '')) - parseFloat(String(b.price).replace(/[^\d.]/g, ''));
    }
    if (sortBy === 'Price: High to Low') {
      return parseFloat(String(b.price).replace(/[^\d.]/g, '')) - parseFloat(String(a.price).replace(/[^\d.]/g, ''));
    }
    if (sortBy === 'Best Rated') {
      return (b.stars || 0) - (a.stars || 0);
    }
    
    // Default: Sort by newest arrivals (usually the order they come from API)
    return 0;
  });


  useEffect(() => {
    if (!base || base.length === 0) return;
    const colorsMap = new Map();
    base.forEach(p => {
      if (p.colors && Array.isArray(p.colors)) {
        p.colors.forEach(c => {
          if (c.name) {
            const variantName = c.name.trim();
            // Split combined names like "Red/Blue" into separate filters
            const parts = variantName.split(/[\/,&\-]+/).map(s => s.trim()).filter(Boolean);
            
            parts.forEach((part, idx) => {
              const normalizedPart = part.toLowerCase();
              if (!colorsMap.has(normalizedPart)) {
                // If variant has multiple hexes, try to match the index, otherwise use the first one
                const hexArr = c.hexArray && c.hexArray.length ? c.hexArray : [c.hex];
                const hex = hexArr[idx] || hexArr[0];
                colorsMap.set(normalizedPart, { 
                   displayName: part.charAt(0).toUpperCase() + part.slice(1), 
                  hex 
                });
              }
            });
          }
        });
      }
    });
    const uniqueColors = Array.from(colorsMap.values()).map(c => ({ name: c.displayName, hex: c.hex }));
    onColorsUpdate(uniqueColors);
  }, [base, onColorsUpdate]);

  useEffect(() => {
    onCountUpdate(filtered.length);
  }, [filtered.length, onCountUpdate]);

  if (apiProducts === null && !propProducts) {
    return <div className="pg-loading"><p>Loading products...</p></div>;
  }

  if (!filtered.length) {
    return <div className="pg-empty"><p>No products found.</p></div>;
  }

  // ── Pagination Calculation ──
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages || 1);
  const paginatedItems = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  const handlePageChange = (newPage) => {
    setSearchParams(prev => {
      prev.set('page', String(newPage));
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const formatPrice = (price) => {
    if (typeof price === 'number') return `₹${price}`;
    return price;
  };

  const getBadgeClass = (badge) => {
    if (badge === 'Bestselling') return 'pg-badge pg-badge-best';
    if (badge === 'Sale') return 'pg-badge pg-badge-sale';
    if (badge === 'New') return 'pg-badge pg-badge-new';
    return 'pg-badge';
  };

  return (
    <div className="pg-container" ref={gridTopRef}>
      <div className="pg-grid">
        {paginatedItems.map((product) => {
          const firstColor = product.colors?.[0];
          const displayName = (firstColor?.productName && firstColor.productName.trim() !== '') ? firstColor.productName : product.name;
          const displayPriceVal = (firstColor?.price != null && firstColor.price !== '') ? firstColor.price : product.price;

          return (
            <Link
              key={product._id || product.id}
              to={`/collections/${product.ageGroup || toAgeGroup(product.age)}/${toSlug(product.name)}`}
              className="pg-card"
            >
              <div className={`pg-img-wrap ${product.stock <= 0 ? 'pg-out-of-stock' : ''}`}>
                <img src={product.img} alt={displayName} />
                {product.stock <= 0 && (
                  <div className="pg-out-overlay">
                    <span>Currently not available</span>
                  </div>
                )}
                {product.badge && (
                  <span className={getBadgeClass(product.badge)}>{product.badge}</span>
                )}
                {product.age && <span className="pg-age-badge">AGE {product.age.replace(/Months?/ig, 'M').replace(/Years?/ig, 'Y')}</span>}
                <button
                  className={`pg-wishlist ${isWishlisted(product._id || product.id) ? 'pg-wishlist--active' : ''}`}
                  aria-label="Wishlist"
                  onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                >
                  {isWishlisted(product._id || product.id) ? '♥' : '♡'}
                </button>
              </div>
              <div className="pg-info">
                <span className="pg-category">{(Array.isArray(product.category) ? product.category : [product.category])[0]}</span>
                <div className="pg-name">{displayName}</div>
                <Stars rating={product.stars || 0} reviews={product.reviews || 0} />
                <div className="pg-price-row">
                  <span className="pg-price">{formatPrice(displayPriceVal)}</span>
                  {product.oldPrice && <span className="pg-old-price">{formatPrice(product.oldPrice)}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="pg-pagination">
          <button 
            className="pg-pag-btn"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>
          <span className="pg-pag-info">{currentPage} / {totalPages}</span>
          <button 
            className="pg-pag-btn"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
