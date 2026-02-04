import React, { useState, useEffect, useRef } from 'react';
import { FaInfoCircle, FaMinus, FaPlus, FaShoppingCart } from 'react-icons/fa';
import { PRIMARY_COLOR, ACCENT_COLOR, DANGER_COLOR, TEXT_COLOR, LIGHT_TEXT_COLOR, CARD_BACKGROUND } from '../constants/colors';
import { getImageSrc, getFallbackImageSrc, createLazyImageObserver } from '../utils/imageLoader';

const ProductCard = ({ product, cart, updateQuantity, onProductClick }) => {
  const currentQuantity = cart[product.id] || 0;
  const [qtyInput, setQtyInput] = useState(currentQuantity.toString());
  const [imgSrc, setImgSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setQtyInput(currentQuantity.toString());
  }, [currentQuantity]);

  // Lazy load image when it enters viewport
  useEffect(() => {
    const webpSrc = getImageSrc(product);
    const jpgSrc = getFallbackImageSrc(product);
    const imgElement = imgRef.current;
    
    if (!imgElement) return;

    const observer = createLazyImageObserver((target) => {
      // Image is in viewport, start loading
      setIsLoading(true);
      setHasError(false);
      
      // Try WebP first
      const img = new Image();
      img.onload = () => {
        setImgSrc(webpSrc);
        setIsLoading(false);
      };
      img.onerror = () => {
        // WebP failed, try JPG fallback
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          setImgSrc(jpgSrc);
          setIsLoading(false);
        };
        fallbackImg.onerror = () => {
          setHasError(true);
          setIsLoading(false);
        };
        fallbackImg.src = jpgSrc;
      };
      img.src = webpSrc;
    });

    observer.observe(imgElement);

    return () => {
      if (imgElement) {
        observer.unobserve(imgElement);
      }
    };
  }, [product]);

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleQtyInputChange = (value) => {
    if (/^\d*$/.test(value)) {
      setQtyInput(value);
      const newQty = parseInt(value, 10);
      if (!isNaN(newQty)) {
        const diff = newQty - currentQuantity;
        if (diff !== 0) updateQuantity(product.id, diff);
      }
    }
  };

  const handleQtyBlur = () => {
    const newQty = parseInt(qtyInput, 10);
    if (!qtyInput || isNaN(newQty)) {
      setQtyInput(currentQuantity.toString());
    } else {
      setQtyInput(newQty.toString());
    }
  };

  const isOutOfStock = product.stock && String(product.stock).toLowerCase() === 'out of stock';

  return (
    <div
      onClick={() => onProductClick(product)}
      className="product-card-container"
      style={{
        backgroundColor: CARD_BACKGROUND,
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        minHeight: '200px',
        position: 'relative',
        border: '1px solid #f1f5f9',
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      {/* Loading Skeleton */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e0e0e0',
            borderTop: '3px solid PRIMARY_COLOR',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Image Container */}
      <div style={{
        width: '100%',
        height: '120px',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {!hasError ? (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={product.name}
            onError={handleImageError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.3s ease'
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: LIGHT_TEXT_COLOR,
            fontSize: '12px',
            textAlign: 'center',
            padding: '8px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>📷</div>
            Image not available
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{
          fontSize: '15px', fontWeight: '700', color: TEXT_COLOR, margin: '0 0 4px 0', lineHeight: '1.3'
        }}>
          {product.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
          {/* Status Badge - Simplified */}
          <span style={{
            fontSize: '11px', fontWeight: '700',
            color: isOutOfStock ? DANGER_COLOR : '#059669',
            backgroundColor: isOutOfStock ? '#fef2f2' : '#ecfdf5',
            padding: '2px 6px', borderRadius: '4px'
          }}>
            {isOutOfStock ? 'Out of Stock' : 'In Stock'}
          </span>

          {/* Cut Price Badge if applicable */}
          {product.cutPrice > 0 && (
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', backgroundColor: '#fef2f2', padding: '2px 6px', borderRadius: '4px' }}>
              -{Math.round(((product.cutPrice - product.price) / product.cutPrice) * 100)}%
            </span>
          )}
          
          {/* Promo Communicator Badge */}
          {product.promoCommunicator && product.promoCommunicator.trim() && (
            <span style={{ fontSize: '11px', fontWeight: '700', color: PRIMARY_COLOR, backgroundColor: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
              {product.promoCommunicator}
            </span>
          )}
        </div>

        {/* Price Display */}
        <div style={{ marginTop: 'auto', marginBottom: '12px', fontSize: '15px', fontWeight: '700', color: PRIMARY_COLOR }}>
          {product.cutPrice > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <span style={{ textDecoration: 'line-through', color: LIGHT_TEXT_COLOR, fontSize: '12px', fontWeight: '500' }}>
                UGX {Number(product.cutPrice).toLocaleString()}
              </span>
              <span>
                {Number(product.price).toLocaleString()}
                <span style={{ fontSize: '11px', fontWeight: '500', marginLeft: '2px', color: LIGHT_TEXT_COLOR }}>UGX</span>
              </span>
            </div>
          ) : (
            <span>
              {Number(product.price).toLocaleString()}
              <span style={{ fontSize: '11px', fontWeight: '500', marginLeft: '2px', color: LIGHT_TEXT_COLOR }}>UGX</span>
            </span>
          )}
        </div>

        {/* ACTION AREA - Large Tap Targets */}
        {currentQuantity === 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, 1); }}
            disabled={isOutOfStock}
            style={{
              backgroundColor: isOutOfStock ? '#e5e5e5' : ACCENT_COLOR,
              color: isOutOfStock ? '#999' : 'white',
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              borderRadius: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: isOutOfStock ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <FaShoppingCart size={16} /> {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </button>
        ) : (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}
          >
            <button
              onClick={() => updateQuantity(product.id, -1)}
              style={{
                width: '44px', height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'white', border: '1px solid #e2e8f0',
                color: TEXT_COLOR, borderRadius: '12px', cursor: 'pointer',
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
                flex: 1,
                width: '100%',
                height: '44px',
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: '700',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: TEXT_COLOR,
                outline: 'none',
                WebkitAppearance: 'none',
                margin: 0
              }}
            />

            <button
              onClick={() => updateQuantity(product.id, 1)}
              style={{
                width: '44px', height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: ACCENT_COLOR, border: 'none',
                color: 'white', borderRadius: '12px', cursor: 'pointer',
                padding: 0
              }}
            >
              <FaPlus size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
