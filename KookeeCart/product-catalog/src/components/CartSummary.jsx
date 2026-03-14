// CartSummary.js (modified) - add preview button prop
import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { CARD_BACKGROUND, ACCENT_COLOR, DANGER_COLOR, TEXT_COLOR, LIGHT_TEXT_COLOR, PRIMARY_COLOR } from '../constants/colors';

export default function CartSummary({ totalItems = 0, totalPrice = 0, onOrderClick, onPreviewClick, cartRef }) {
  // Mobile-first fixed bottom styling
  return (
    <div ref={cartRef} className="glass-cart" style={{
      position: 'fixed',
      bottom: 0, // Traditional sticky footer
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '12px 16px', // Reduced padding
      boxShadow: '0 -10px 30px rgba(0,0,0,0.1)', // Subtle upward shadow
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px', // Reduced gap
      borderTop: '1px solid #f1f5f9'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', color: LIGHT_TEXT_COLOR, fontWeight: '500' }}>
          Total ({totalItems} items)
        </div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: totalPrice >= 200000 ? PRIMARY_COLOR : DANGER_COLOR }}>
          UGX {totalPrice.toLocaleString()}
        </div>
        {totalPrice < 200000 && (
          <div style={{ fontSize: '10px', color: DANGER_COLOR, fontWeight: '600' }}>
            Min order: UGX 200,000
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onPreviewClick} disabled={totalItems === 0} style={{
          padding: '8px 16px', // Reduced padding
          borderRadius: '8px', // Smaller radius
          border: '1px solid #e2e8f0',
          background: 'white',
          color: TEXT_COLOR,
          cursor: totalItems > 0 ? 'pointer' : 'not-allowed',
          fontWeight: '600', // Reduced weight
          fontSize: '13px', // Smaller font
          minHeight: '36px', // Reduced touch target
          minWidth: '36px'
        }}>
          Preview
        </button>

        <button onClick={onOrderClick} disabled={totalPrice < 200000} style={{
          background: totalPrice >= 200000 ? PRIMARY_COLOR : '#e2e8f0', // Terracotta (African-inspired)
          color: 'white',
          border: 'none',
          padding: '8px 24px', // Reduced padding
          borderRadius: '8px', // Smaller radius
          cursor: totalPrice >= 200000 ? 'pointer' : 'not-allowed',
          fontWeight: '700',
          fontSize: '14px', // Smaller font
          display: 'flex',
          alignItems: 'center',
          gap: '8px', // Reduced gap
          minHeight: '36px', // Reduced touch target
          boxShadow: totalPrice >= 200000 ? `0 4px 15px rgba(212, 112, 74, 0.3)` : 'none'
        }}>
          <FaWhatsapp size={20} /> Order Now
        </button>
      </div>
    </div>
  );
}
