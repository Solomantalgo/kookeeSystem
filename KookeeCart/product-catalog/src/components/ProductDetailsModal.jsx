import React, { useState, useEffect } from 'react';
import { FaTimes, FaMinus, FaPlus } from 'react-icons/fa';
import { PRIMARY_COLOR, CARD_BACKGROUND, ACCENT_COLOR, DANGER_COLOR, TEXT_COLOR, LIGHT_TEXT_COLOR, BACKGROUND_COLOR } from '../constants/colors';

export default function ProductDetailsModal({ product, cart = {}, updateQuantity = () => { }, onClose = () => { } }) {
  const currentQty = cart[product.id] || 0;
  const [qtyInput, setQtyInput] = React.useState(currentQty.toString());
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    setQtyInput(currentQty.toString());
  }, [currentQty]);

  const handleQtyInputChange = (value) => {
    if (value === '') {
      setQtyInput('');
      return;
    }
    if (/^\d*$/.test(value)) {
      setQtyInput(value);
      const newQty = parseInt(value, 10);
      if (!isNaN(newQty)) {
        updateQuantity(product.id, newQty - currentQty);
      }
    }
  };

  const handleQtyBlur = () => {
    if (qtyInput === '' || isNaN(parseInt(qtyInput))) {
      setQtyInput(currentQty.toString());
    }
  };

  if (!product) return null;

  const isOutOfStock = product.stock && String(product.stock).toLowerCase() === 'out of stock';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000,
      padding: '0', // No padding on mobile for full width
    }} onClick={onClose}>

      {/* Content Container - Responsive: Full screen on mobile, centered card on desktop */}
      <div style={{
        backgroundColor: CARD_BACKGROUND,
        width: '100%',
        height: '100%', // Full height on mobile default
        maxWidth: '600px',
        maxHeight: '90vh', // Desktop constraint (overridden by media query if we had css, but inline is tricky. Let's stick to full-ish screen or bottom sheet feel)
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        // In a real app we'd use media queries. Here we'll default to a "Sheet" look.
        borderRadius: '16px', // Rounded corners
        margin: '16px', // Floating margin on desktop/tablet
      }} onClick={(e) => e.stopPropagation()}>

        {/* Close Button - Floating */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(255,255,255,0.9)',
          border: 'none', borderRadius: '50%',
          width: '40px', height: '40px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '18px', color: TEXT_COLOR,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10
        }}>
          <FaTimes />
        </button>

        {/* Image Section */}
        <div style={{
          width: '100%',
          backgroundColor: '#f5f5f4',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          minHeight: '250px'
        }}>
          {isLoading ? (
            // Loading skeleton
            <div style={{
              width: '100%',
              maxWidth: '300px',
              height: '250px',
              backgroundColor: '#e5e5e5',
              borderRadius: '8px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}>
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.5; }
                }
              `}</style>
            </div>
          ) : hasError ? (
            // Error fallback - local inline div with no external requests
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '300px',
              height: '250px',
              color: LIGHT_TEXT_COLOR,
              fontSize: '14px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
              Image not available
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: '300px', textAlign: 'center' }}>
              {(() => {
                const cleanName = product.name ? product.name.replace(/[^a-zA-Z0-9]/g, '') : 'product';
                const localImage = `/images/${cleanName}.jpg`;
                return (
                  <img
                    src={localImage}
                    alt={product.name}
                    onLoad={() => setIsLoading(false)}
                    onError={() => { setHasError(true); setIsLoading(false); }}
                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                  />
                );
              })()}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '8px', fontSize: '13px', color: LIGHT_TEXT_COLOR, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
            {product.category}
          </div>

          <h2 style={{ margin: '0 0 12px 0', color: TEXT_COLOR, fontSize: '24px', fontWeight: '700' }}>{product.name}</h2>

          {/* Status Badge */}
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '50px',
            backgroundColor: isOutOfStock ? '#fef2f2' : '#ecfdf5',
            color: isOutOfStock ? DANGER_COLOR : '#059669',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            {isOutOfStock ? 'Out of Stock' : 'In Stock'}
          </div>

          <p style={{ margin: '0 0 24px 0', color: LIGHT_TEXT_COLOR, lineHeight: '1.7', fontSize: '15px' }}>
            {product.description}
          </p>

          {/* Footer / Actions - Pushed to bottom */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid #f0f0f0', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', color: LIGHT_TEXT_COLOR }}>Price</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: PRIMARY_COLOR }}>
                {product.price.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '500' }}>UGX</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f9fafb', padding: '6px', borderRadius: '12px' }}>
              <button
                onClick={() => updateQuantity(product.id, -1)}
                disabled={!currentQty}
                style={{
                  width: '40px', height: '40px',
                  borderRadius: '10px', border: 'none',
                  background: 'white', color: TEXT_COLOR,
                  cursor: currentQty ? 'pointer' : 'not-allowed',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: currentQty ? 1 : 0.5,
                  padding: 0
                }}
              >
                <FaMinus size={14} />
              </button>

              <input
                type="number"
                min="0"
                value={qtyInput}
                onChange={(e) => handleQtyInputChange(e.target.value)}
                onBlur={handleQtyBlur}
                style={{
                  width: '50px',
                  textAlign: 'center',
                  fontSize: '18px',
                  fontWeight: '700',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: TEXT_COLOR,
                  padding: '4px 0',
                  outline: 'none'
                }}
              />

              <button
                onClick={() => updateQuantity(product.id, 1)}
                style={{
                  width: '40px', height: '40px',
                  borderRadius: '10px', border: 'none',
                  background: ACCENT_COLOR, color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(217, 119, 6, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0
                }}
              >
                <FaPlus size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
