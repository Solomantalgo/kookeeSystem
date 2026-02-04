import React, { useState, useEffect } from 'react';
import { FaTimes, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import { CARD_BACKGROUND, TEXT_COLOR, LIGHT_TEXT_COLOR, PRIMARY_COLOR, DANGER_COLOR, ACCENT_COLOR } from '../constants/colors';

// --- Sub-component for smooth manual typing in Order Preview ---
function OrderPreviewQuantityControl({ item, updateQuantity }) {
  const [qtyInput, setQtyInput] = useState(item.qty.toString());

  useEffect(() => {
    setQtyInput(item.qty.toString());
  }, [item.qty]);

  const handleQtyInputChange = (value) => {
    if (value === '') {
      setQtyInput('');
      return;
    }
    if (/^\d*$/.test(value)) {
      setQtyInput(value);
      const newQty = parseInt(value, 10);
      if (!isNaN(newQty)) {
        updateQuantity(item.id, newQty - item.qty);
      }
    }
  };

  const handleQtyBlur = () => {
    if (qtyInput === '' || isNaN(parseInt(qtyInput))) {
      setQtyInput(item.qty.toString());
    } else {
      setQtyInput(parseInt(qtyInput, 10).toString());
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={() => updateQuantity(item.id, -1)}
        style={{
          width: 32, height: 32, borderRadius: 8, border: 'none',
          background: '#eee', color: TEXT_COLOR, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
        }}
      >
        <FaMinus size={10} />
      </button>

      <input
        type="number"
        min="0"
        value={qtyInput}
        onChange={(e) => handleQtyInputChange(e.target.value)}
        onBlur={handleQtyBlur}
        style={{
          width: '44px', textAlign: 'center', fontSize: '14px', fontWeight: 700,
          border: '1px solid #eee', borderRadius: '6px', padding: '4px 0',
          backgroundColor: '#f9fafb', color: TEXT_COLOR, outline: 'none'
        }}
      />

      <button
        onClick={() => updateQuantity(item.id, 1)}
        style={{
          width: 32, height: 32, borderRadius: 8, border: 'none',
          background: PRIMARY_COLOR, color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
        }}
      >
        <FaPlus size={10} />
      </button>
    </div>
  );
}

export default function OrderPreview({ show, cart = {}, products = [], updateQuantity = () => { }, onClose = () => { }, onProceed = () => { } }) {
  if (!show) return null;

  const items = Object.entries(cart)
    .map(([id, qty]) => {
      const p = products.find(x => String(x.id) === String(id));
      return p ? { ...p, qty } : null;
    })
    .filter(Boolean);

  const total = items.reduce((s, it) => s + it.price * it.qty, 0);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: '20px 10px'
    }} onClick={onClose}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        maxHeight: '85vh',
        background: CARD_BACKGROUND,
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #eee'
        }}>
          <h3 style={{ margin: 0, color: TEXT_COLOR }}>Order Preview</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: LIGHT_TEXT_COLOR }}><FaTimes /></button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {items.length === 0 ? (
            <p style={{ color: LIGHT_TEXT_COLOR, textAlign: 'center' }}>Your cart is empty.</p>
          ) : (
            items.map(it => (
              <div key={it.id} style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #f0f0f0',
                background: 'white'
              }}>
                {(() => {
                  const cleanName = it.name ? it.name.replace(/[^a-zA-Z0-9]/g, '') : 'product';
                  const localImage = `/images/${cleanName}.jpg`;
                  return (
                    <img
                      src={localImage}
                      alt={it.name}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/64'; }} // Still use small placeholder if needed in preview
                      style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 6 }}
                    />
                  );
                })()}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: TEXT_COLOR, fontSize: '14px' }}>{it.name}</div>
                  <div style={{ color: LIGHT_TEXT_COLOR, fontSize: 13 }}>UGX {it.price.toLocaleString()}</div>
                </div>

                <OrderPreviewQuantityControl item={it} updateQuantity={updateQuantity} />

                <button
                  onClick={() => updateQuantity(it.id, -it.qty)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: DANGER_COLOR,
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                  title="Remove item"
                >
                  <FaTrash />
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{
          borderTop: '1px solid #eee',
          padding: '16px 20px',
          background: 'white'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <div style={{ fontWeight: 800, color: PRIMARY_COLOR, fontSize: 18 }}>
              Total: UGX {total.toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: 'white',
                cursor: 'pointer',
                color: TEXT_COLOR
              }}
            >
              Close
            </button>
            <button
              onClick={onProceed}
              disabled={items.length === 0}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: 8,
                border: 'none',
                background: items.length === 0 ? '#ccc' : PRIMARY_COLOR,
                color: 'white',
                cursor: items.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 700
              }}
            >
              Proceed to Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}