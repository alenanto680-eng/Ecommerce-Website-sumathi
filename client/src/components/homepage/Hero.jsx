import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../../styles/homepage/Hero.css';

const avatarUrls = [
  'https://i.pravatar.cc/100?u=11',
  'https://i.pravatar.cc/100?u=22',
  'https://i.pravatar.cc/100?u=33',
];

const PHRASES = [
  'Best Kidswear Bangalore',
  'Premium Kids Cloths',
  'Ages 0–12 Essentials',
  'Loved by 2,400+ Parents',
  'Adventure-Ready Styles',
];

const TYPING_SPEED = 60;    // ms per character
const DELETING_SPEED = 35;  // ms per character
const PAUSE_AFTER_TYPE = 1600;  // ms before deleting
const PAUSE_AFTER_DELETE = 400; // ms before next phrase

export default function Hero() {
  const [displayed, setDisplayed] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const currentPhrase = PHRASES[phraseIndex];

    if (!isDeleting && displayed === currentPhrase) {
      // Finished typing — pause then start deleting
      setIsPaused(true);
      setTimeout(() => {
        setIsDeleting(true);
        setIsPaused(false);
      }, PAUSE_AFTER_TYPE);
      return;
    }

    if (isDeleting && displayed === '') {
      // Finished deleting — pause then move to next phrase
      setIsPaused(true);
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % PHRASES.length);
        setIsDeleting(false);
        setIsPaused(false);
      }, PAUSE_AFTER_DELETE);
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayed((prev) =>
        isDeleting
          ? prev.slice(0, -1)
          : currentPhrase.slice(0, prev.length + 1)
      );
    }, isDeleting ? DELETING_SPEED : TYPING_SPEED);

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, isPaused, phraseIndex]);

  return (
    <section className="hero-section">
      <div className="section-inner">
        <div className="hero">

          {/* Left: Content */}
          <div className="hero-content">

            {/* Typewriter tag */}
            <div className="hero-tag">
              <span className="dot" />
              <span className="typewriter-js">{displayed}<span className="cursor">|</span></span>
            </div>

            {/* Hidden H1 for SEO ranking without affecting design */}
            <h1 className="sr-only" style={{
              position: 'absolute', width: '1px', height: '1px', padding: '0',
              margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: '0'
            }}>
              Kidswear & Kids Cloths in Bangalore Karnataka | 0-12 Years
            </h1>

            <div className="hero-title">
              <span className="line-1">Modern Style</span>
              <span className="line-2">
                for <span className="accent-inline">Little</span>
              </span>
              <span className="accent">Legends</span>
            </div>

            <p className="hero-desc">
              Discover the <strong>Best Kids Clothing in Kodigehalli & Bangalore</strong>.
              Crafted with love using premium fabrics, designed for comfort and style for every little adventure from ages 0–12.
            </p>

            <Link to="/collections" className="btn-collection">
              View Collection
              <ArrowRight size={18} />
            </Link>

            <div className="trust-bar">
              <div className="trust-avatars">
                {avatarUrls.map((url, i) => (
                  <div
                    key={i}
                    className="avatar-pill"
                    style={{ backgroundImage: `url(${url})` }}
                  />
                ))}
              </div>
              <div className="trust-text">
                <span>2,400+</span> Happy parents trust us
              </div>
            </div>
          </div>

          {/* Right: Visuals */}
          <div className="hero-visuals">
            <img
              src="/images/homepage/hero.webp"
              alt="Model"
              className="main-model"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
