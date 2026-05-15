import { useRef, useState } from 'react';
import '../../styles/collectiondetails/ImageZoom.css';

const ZOOM_LEVEL = 2.5;

export default function ImageZoom({ src, alt, onZoomChange }) {
  const containerRef       = useRef(null);
  const [enabled, setEnabled] = useState(false);

  const handleMouseMove = (e) => {
    if (!enabled) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    onZoomChange({
      active: true,
      src,
      bgPos:  `${x}% ${y}%`,
      bgSize: `${ZOOM_LEVEL * 100}%`,
    });
  };

  const handleMouseLeave = () => {
    if (!enabled) return;
    onZoomChange({ active: false });
  };

  const toggleZoom = (e) => {
    e.stopPropagation();
    const next = !enabled;
    setEnabled(next);
    if (!next) onZoomChange({ active: false });
  };

  return (
    <div
      className="iz-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: enabled ? 'crosshair' : 'default' }}
    >
      <img src={src} alt={alt} className="iz-img" draggable={false} />

      {/* Zoom toggle button — top right corner */}
      <button
        className={`iz-zoom-btn${enabled ? ' iz-zoom-btn--active' : ''}`}
        onClick={toggleZoom}
        title={enabled ? 'Disable zoom' : 'Enable zoom'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          {!enabled && <><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></>}
        </svg>
      </button>
    </div>
  );
}
