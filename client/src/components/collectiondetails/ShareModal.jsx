import React from 'react';
import { X, Copy, Mail, Twitter, Facebook, MessageCircle, Instagram } from 'lucide-react';
import '../../styles/collectiondetails/ShareModal.css';

export default function ShareModal({ isOpen, onClose, productUrl, productName }) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(productUrl);
  const encodedName = encodeURIComponent(productName);

  const shareOptions = [
    {
      name: 'Facebook',
      icon: <img src="/images/icons/facebook.png" alt="Facebook" className="sm-social-img" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'Whatsapp',
      icon: <img src="/images/icons/whatsapp.png" alt="Whatsapp" className="sm-social-img" />,
      url: `https://wa.me/?text=${encodedName}%20${encodedUrl}`,
    },
    {
      name: 'Instagram',
      icon: <img src="/images/icons/instagram.png" alt="Instagram" className="sm-social-img" />,
      url: `https://www.instagram.com/`,
    },
    {
      name: 'Email',
      icon: <img src="/images/icons/gmail.png" alt="Email" className="sm-social-img" />,
      url: `mailto:?subject=${encodedName}&body=Check out this product: ${productUrl}`,
    },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(productUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="sm-overlay" onClick={onClose}>
      <div className="sm-content" onClick={(e) => e.stopPropagation()}>
        <button className="sm-top-close" onClick={onClose}><X size={20} /></button>
        
        <div className="sm-header">
          <h2 className="sm-title">Share with Friends</h2>
        </div>

        <div className="sm-section">
          <label className="sm-label">Share you link</label>
          <div className="sm-copy-box">
            <input type="text" readOnly value={productUrl} className="sm-link-input" />
            <button className="sm-copy-btn" onClick={copyToClipboard} title="Copy Link">
              <Copy size={20} />
            </button>
          </div>
        </div>

        <div className="sm-section">
          <label className="sm-label">Share to</label>
          <div className="sm-row">
            {shareOptions.map((opt) => (
              <a 
                key={opt.name} 
                href={opt.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="sm-circle-option"
              >
                <div className="sm-circle-icon">
                  {opt.icon}
                </div>
                <span>{opt.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
