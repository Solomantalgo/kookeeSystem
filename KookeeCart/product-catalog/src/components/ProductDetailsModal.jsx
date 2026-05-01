import React, { useState, useEffect } from 'react';
import { FaTimes, FaMinus, FaPlus } from 'react-icons/fa';
import { PRIMARY_COLOR, CARD_BACKGROUND, ACCENT_COLOR, DANGER_COLOR, TEXT_COLOR, LIGHT_TEXT_COLOR } from '../constants/colors';

export default function ProductDetailsModal({ product, cart = {}, updateQuantity = () => { }, onClose = () => { } }) {
  const currentQty = cart[product.id] !== undefined ? cart[product.id] : 0;
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
    setQtyInput(value);
    updateQuantity(product.id, value);
  };

  const handleQtyBlur = () => {
    if (qtyInput === '') {
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
      padding: '0',
    }} onClick={onClose}>

      <div style={{
        backgroundColor: CARD_BACKGROUND,
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '20px',
        margin: '16px',
      }} onClick={(e) => e.stopPropagation()}>

        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(255,255,255,0.9)',
          border: 'none', borderRadius: '50%',
          width: '36px', height: '36px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '18px', color: TEXT_COLOR,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10
        }}>
          <FaTimes size={16} />
        </button>

        <div style={{
          width: '100%',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '30px',
          minHeight: '200px'
        }}>
          <img
            src={product.image}
            alt={product.name}
            style={{ maxWidth: '100%', maxHeight: '250px', objectFit: 'contain' }}
          />
        </div>

        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '4px', fontSize: '12px', color: LIGHT_TEXT_COLOR, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
            {product.category}
          </div>

          <h2 style={{ margin: '0 0 8px 0', color: TEXT_COLOR, fontSize: '20px', fontWeight: '700' }}>{product.name}</h2>

          <div style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '50px',
            backgroundColor: isOutOfStock ? '#fef2f2' : '#ecfdf5',
            color: isOutOfStock ? DANGER_COLOR : '#059669',
            fontSize: '12px',
            fontWeight: '700',
            marginBottom: '16px',
            width: 'fit-content'
          }}>
            {isOutOfStock ? 'Out of Stock' : 'In Stock'}
          </div>

          <p style={{ margin: '0 0 24px 0', color: LIGHT_TEXT_COLOR, lineHeight: '1.6', fontSize: '14px' }}>
            {product.description || 'No description available for this product.'}
          </p>

          <div style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: TEXT_COLOR }}>Quantity</span>
            
            {(!currentQty && currentQty !== "") ? (
              <button
                onClick={() => updateQuantity(product.id, "")}
                disabled={isOutOfStock}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isOutOfStock ? '#f1f5f9' : PRIMARY_COLOR,
                  color: isOutOfStock ? '#94a3b8' : 'white',
                  fontWeight: '700',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                }}
              >
                Add to Cart
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                <button
                  onClick={() => updateQuantity(product.id, -1)}
                  style={{
                    width: '36px', height: '36px',
                    borderRadius: '10px', border: 'none',
                    background: 'white', color: TEXT_COLOR,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <FaMinus size={12} />
                </button>

                <input
                  type="text"
                  autoFocus
                  value={qtyInput}
                  onChange={(e) => handleQtyInputChange(e.target.value)}
                  onBlur={handleQtyBlur}
                  style={{
                    width: '60px',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '700',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: TEXT_COLOR,
                    outline: 'none'
                  }}
                  placeholder="0"
                />

                <button
                  onClick={() => updateQuantity(product.id, 1)}
                  style={{
                    width: '36px', height: '36px',
                    borderRadius: '10px', border: 'none',
                    background: PRIMARY_COLOR, color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(200, 90, 50, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <FaPlus size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
