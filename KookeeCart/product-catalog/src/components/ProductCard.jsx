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
        borderRadius: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        minHeight: '280px',
        position: 'relative',
        border: '1px solid rgba(0,0,0,0.04)',
        height: '100%',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
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
          backgroundColor: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          borderRadius: '20px 20px 0 0'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #f0f0f0',
            borderTop: `3px solid ${PRIMARY_COLOR}`,
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

      {/* Image Container - Improved */}
      <div style={{
        width: '100%',
        height: '140px',
        backgroundColor: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px 20px 0 0'
      }}>
        {!hasError ? (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={product.name}
            onError={handleImageError}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: '12px',
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
            padding: '16px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>📷</div>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>Image unavailable</span>
          </div>
        )}
      </div>

      {/* CONTENT AREA - Improved spacing */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{
          fontSize: '14px', 
          fontWeight: '600', 
          color: TEXT_COLOR, 
          margin: '0 0 8px 0', 
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '40px'
        }}>
          {product.name}
        </h3>

        {/* Badges - Improved styling */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {product.cutPrice > 0 && (
            <span style={{ 
              fontSize: '10px', 
              fontWeight: '700', 
              color: '#fff', 
              backgroundColor: DANGER_COLOR, 
              padding: '3px 8px', 
              borderRadius: '12px',
              letterSpacing: '0.3px'
            }}>
              -{Math.round(((product.cutPrice - product.price) / product.cutPrice) * 100)}%
            </span>
          )}
          {product.promoCommunicator && product.promoCommunicator.trim() && (
            <span style={{ 
              fontSize: '10px', 
              fontWeight: '600', 
              color: ACCENT_COLOR, 
              backgroundColor: '#FFF8F0', 
              padding: '3px 8px', 
              borderRadius: '12px',
              border: '1px solid rgba(229, 138, 50, 0.3)'
            }}>
              {product.promoCommunicator}
            </span>
          )}
          <span style={{
            fontSize: '10px', 
            fontWeight: '600',
            color: isOutOfStock ? DANGER_COLOR : '#059669',
            backgroundColor: isOutOfStock ? '#FEF2F2' : '#F0FDF4',
            padding: '3px 8px', 
            borderRadius: '12px'
          }}>
            {isOutOfStock ? 'Out of Stock' : 'In Stock'}
          </span>
        </div>

        {/* Price Display - Removed - contact for price */}
        <div style={{ marginTop: 'auto', marginBottom: '12px' }}>
          <span style={{ color: PRIMARY_COLOR, fontSize: '13px', fontWeight: '600' }}>
            Contact for price
          </span>
        </div>

        {/* ACTION AREA - Improved button */}
        {currentQuantity === 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, 1); }}
            disabled={isOutOfStock}
            style={{
              backgroundColor: isOutOfStock ? '#f5f5f5' : `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #D4772A 100%)`,
              color: isOutOfStock ? '#999' : 'white',
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              borderRadius: '14px',
              fontWeight: '700',
              border: 'none',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isOutOfStock ? 'none' : '0 4px 12px rgba(229, 138, 50, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            <FaShoppingCart size={14} />
            {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </button>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fafafa',
            borderRadius: '14px',
            padding: '4px',
            border: '1px solid #f0f0f0'
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, -1); }}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'white',
                color: TEXT_COLOR,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                padding: 0
              }}
            >
              <FaMinus size={12} />
            </button>
            <span style={{ fontSize: '16px', fontWeight: '700', color: TEXT_COLOR, minWidth: '30px', textAlign: 'center' }}>
              {currentQuantity}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, 1); }}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: PRIMARY_COLOR,
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(200, 90, 50, 0.3)',
                padding: 0
              }}
            >
              <FaPlus size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
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
