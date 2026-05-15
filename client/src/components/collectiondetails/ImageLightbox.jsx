import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/collectiondetails/ImageLightbox.css';

function ImageLightbox({ images, activeIndex, onClose, onPrev, onNext }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose, onPrev, onNext]);

  return createPortal(
    <div className="lb-overlay" onClick={onClose}>

      {/* Close */}
      <button className="lb-close" onClick={onClose}>✕</button>

      {/* Prev */}
      <button
        className="lb-arrow lb-prev"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        disabled={activeIndex === 0}
      >
        ‹
      </button>

      {/* Image */}
      <div className="lb-img-wrap" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[activeIndex].src}
          alt={images[activeIndex].alt}
          className="lb-img"
        />
        <p className="lb-counter">{activeIndex + 1} / {images.length}</p>
      </div>

      {/* Next */}
      <button
        className="lb-arrow lb-next"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        disabled={activeIndex === images.length - 1}
      >
        ›
      </button>

    </div>,
    document.body
  );
}

export default ImageLightbox;
