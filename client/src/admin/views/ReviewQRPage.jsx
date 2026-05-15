import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import '../assets/reviewqrpage.css';

const REVIEW_URL = 'https://sumathitrends.com/review';

export default function ReviewQRPage() {
  const qrRef = useRef(null);
  const cardRef = useRef(null);
  const navigate = useNavigate();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement('a');
    link.download = 'sumathi-trends-review-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="qrp-page">
      <div className="qrp-header">
        <button className="qrp-back" onClick={() => navigate('/admin/reviews')}>Back</button>
        <h1 className="qrp-title">Review QR Code</h1>
        <p className="qrp-sub">Print and place this at your store or include it in packaging so customers can leave a review.</p>
      </div>

      <div className="qrp-card" id="qrp-print-area" ref={cardRef}>
        <div className="qrp-brand">Sumathi Trends</div>
        <p className="qrp-scan-text">Scan to share your review</p>

        <div className="qrp-qr-wrap" ref={qrRef}>
          <img 
            src="/images/Review/static-qr.png" 
            alt="Review QR Code" 
            className="qrp-static-qr"
          />
        </div>

        <p className="qrp-url">{REVIEW_URL}</p>
        <p className="qrp-tagline">We value your feedback!</p>
      </div>

      <div className="qrp-actions no-print">
        <button className="qrp-img-btn" onClick={handleDownload} title="Download PNG">
          <img src="/images/Review/download.png" alt="Download" />
        </button>
        <button className="qrp-img-btn" onClick={handlePrint} title="Print QR">
          <img src="/images/Review/print.png" alt="Print" />
        </button>
      </div>
    </div>
  );
}
