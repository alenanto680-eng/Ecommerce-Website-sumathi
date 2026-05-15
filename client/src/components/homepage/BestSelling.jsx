import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/homepage/BestSelling.css';

const API = '/api/products';

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

export default function BestSelling() {
  const [cards, setCards] = useState([]);
  const navigate = useNavigate();
  const sectionRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/featured?section=bestSelling`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const step = data.data.length > 0 ? 360 / data.data.length : 0;
          setCards(data.data.map((p, i) => ({ ...p, angle: i * step })));
        }
      })
      .catch(console.error);
  }, []);

  if (cards.length === 0) return null;

  const handleCardClick = (card) => {
    sessionStorage.setItem('restoreToSection', 'best-selling');
    navigate(`/collections/product/${card._id}`, {
      state: {
        fromLabel: 'Best Selling',
        restoreScroll: true,
      },
    });
  };

  return (
    <section id="best-selling" ref={sectionRef} className="arrivals-section">
      <div className="section-inner">

        <div className="best-selling-header">
          <h2 className="best-selling-title">
            <span>Best</span> Selling
          </h2>
          <p className="best-selling-sub">
            Our Most Loved Styles, Picked By Parents Everywhere.
          </p>
        </div>

        <div className="orbit-scene">
          <div className="orbit-ring">
            {cards.map((card, i) => (
              <div
                key={card._id || i}
                className="arr-card"
                style={{ transform: `rotateY(${card.angle}deg) translateZ(420px)` }}
                onClick={() => handleCardClick(card)}
              >
                <img src={card.img} alt={card.name} />
                <div className="arr-card-overlay">
                  <div className="arr-hover-btn"><ArrowIcon /></div>
                  <div className="arr-hover-info">
                    {(() => {
                      const firstColor = card.colors?.[0];
                      const displayName = (firstColor?.productName && firstColor.productName.trim() !== '') ? firstColor.productName : card.name;
                      return (
                        <>
                          <span className="arr-hover-tag">{card.category}</span>
                          <div className="arr-hover-name">{displayName}</div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
