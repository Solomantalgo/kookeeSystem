import React, { useState, useEffect, useRef } from 'react';
import { FaMinus, FaPlus, FaShoppingCart, FaStar } from 'react-icons/fa';
import { PRIMARY_COLOR, ACCENT_COLOR, DANGER_COLOR, TEXT_COLOR, LIGHT_TEXT_COLOR, CARD_BACKGROUND } from '../constants/colors';
import { getImageSrc, getFallbackImageSrc, createLazyImageObserver } from '../utils/imageLoader';

const ProductCard = ({ product, cart, updateQuantity, onProductClick }) => {
  const currentQuantity = cart[product.id] !== undefined ? cart[product.id] : 0;
  const [imgSrc, setImgSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  const isPromo = product.promotion === true;

  // Lazy load image
  useEffect(() => {
    const webpSrc = getImageSrc(product);
    const jpgSrc = getFallbackImageSrc(product);
    const imgElement = imgRef.current;
    
    if (!imgElement) return;

    const observer = createLazyImageObserver(() => {
      setIsLoading(true);
      const img = new Image();
      img.onload = () => { setImgSrc(webpSrc); setIsLoading(false); };
      img.onerror = () => {
        const fallbackImg = new Image();
        fallbackImg.onload = () => { setImgSrc(jpgSrc); setIsLoading(false); };
        fallbackImg.onerror = () => { setHasError(true); setIsLoading(false); };
        fallbackImg.src = jpgSrc;
      };
      img.src = webpSrc;
    });

    observer.observe(imgElement);
    return () => { if (imgElement) observer.unobserve(imgElement); };
  }, [product]);

  const isOutOfStock = product.stock && String(product.stock).toLowerCase() === 'out of stock';

  return (
    <div
      onClick={() => onProductClick(product)}
      className={`product-card ${isPromo ? 'promo-card' : ''}`}
      style={{
        backgroundColor: CARD_BACKGROUND,
        borderRadius: '24px',
        boxShadow: isPromo 
          ? `0 10px 25px rgba(200, 90, 50, 0.15), 0 0 0 2px ${PRIMARY_COLOR}` 
          : '0 4px 16px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        minHeight: '280px',
        position: 'relative',
        border: isPromo ? `2px solid ${PRIMARY_COLOR}` : '1px solid rgba(0,0,0,0.05)',
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateZ(0)'
      }}
    >
      {/* Promo Badge */}
      {isPromo && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${ACCENT_COLOR} 100%)`,
          color: 'white',
          padding: '4px 10px',
          borderRadius: '10px',
          fontSize: '10px',
          fontWeight: '900',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 4px 10px rgba(200, 90, 50, 0.3)',
          textTransform: 'uppercase'
        }}>
          <FaStar size={10} /> Promo
        </div>
      )}

      {/* Image Container */}
      <div style={{
        width: '100%',
        height: '150px',
        backgroundColor: isPromo ? '#FFF8F4' : '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '16px'
      }}>
        {!hasError ? (
          <img
            ref={imgRef}
            src={imgSrc}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.3s ease',
              filter: isPromo ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' : 'none'
            }}
          />
        ) : (
          <div style={{ color: LIGHT_TEXT_COLOR, textAlign: 'center' }}>
            <div style={{ fontSize: '32px' }}>📷</div>
            <span style={{ fontSize: '10px' }}>No Image</span>
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
        <h3 style={{
          fontSize: '14px', 
          fontWeight: '700', 
          color: TEXT_COLOR, 
          margin: '0 0 6px 0', 
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '40px'
        }}>
          {product.name}
        </h3>

        {/* Promo Communicator (if any) */}
        {product.promoCommunicator && (
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            color: PRIMARY_COLOR, 
            marginBottom: '10px',
            background: '#FFF1ED',
            padding: '4px 8px',
            borderRadius: '6px',
            width: 'fit-content'
          }}>
            {product.promoCommunicator}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <span style={{
            fontSize: '10px', 
            fontWeight: '700',
            color: isOutOfStock ? DANGER_COLOR : '#059669',
            backgroundColor: isOutOfStock ? '#FEF2F2' : '#F0FDF4',
            padding: '3px 8px', 
            borderRadius: '8px'
          }}>
            {isOutOfStock ? 'Out of Stock' : 'In Stock'}
          </span>
        </div>

        {/* Action Area */}
        <div style={{ marginTop: 'auto' }}>
          {currentQuantity === undefined || currentQuantity === 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, ""); }}
              disabled={isOutOfStock}
              style={{
                background: isOutOfStock ? '#f1f5f9' : (isPromo ? `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${ACCENT_COLOR} 100%)` : PRIMARY_COLOR),
                color: isOutOfStock ? '#94a3b8' : 'white',
                width: '100%',
                padding: '12px',
                fontSize: '13px',
                borderRadius: '14px',
                fontWeight: '800',
                border: 'none',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: isPromo && !isOutOfStock ? '0 4px 12px rgba(200, 90, 50, 0.3)' : 'none'
              }}
            >
              <FaShoppingCart size={14} /> Add
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              padding: '4px',
              border: `1.5px solid ${isPromo ? PRIMARY_COLOR : '#e2e8f0'}`
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, -1); }}
                style={{
                  width: '32px', height: '32px', borderRadius: '10px', border: 'none',
                  backgroundColor: 'white', color: TEXT_COLOR, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <FaMinus size={10} />
              </button>
              
              <input
                type="text"
                autoFocus
                value={currentQuantity}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateQuantity(product.id, e.target.value)}
                style={{
                  width: '60px',
                  textAlign: 'center',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: '800',
                  color: TEXT_COLOR,
                  outline: 'none',
                  padding: '4px 0'
                }}
                placeholder="Type Qty"
              />

              <button
                onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, 1); }}
                style={{
                  width: '32px', height: '32px', borderRadius: '10px', border: 'none',
                  backgroundColor: PRIMARY_COLOR, color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 8px rgba(200, 90, 50, 0.2)'
                }}
              >
                <FaPlus size={10} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
