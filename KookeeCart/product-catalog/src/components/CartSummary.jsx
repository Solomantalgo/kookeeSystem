// CartSummary.js - Improved UI
import React from 'react';
import { FaWhatsapp, FaShoppingBag } from 'react-icons/fa';
import { CARD_BACKGROUND, ACCENT_COLOR, DANGER_COLOR, TEXT_COLOR, LIGHT_TEXT_COLOR, PRIMARY_COLOR } from '../constants/colors';

export default function CartSummary({ totalItems = 0, totalPrice = 0, onOrderClick, onPreviewClick, cartRef }) {
  return (
    <div ref={cartRef} style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '12px 16px',
      background: CARD_BACKGROUND,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
      borderTop: '1px solid rgba(0,0,0,0.04)'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <FaShoppingBag size={12} style={{ color: PRIMARY_COLOR }} />
          <span style={{ fontSize: '11px', color: LIGHT_TEXT_COLOR, fontWeight: '500' }}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div style={{ fontSize: '20px', fontWeight: '800', color: TEXT_COLOR }}>
          UGX {totalPrice.toLocaleString()}
        </div>
        {totalPrice > 0 && totalPrice < 200000 && (
          <div style={{ fontSize: '10px', color: DANGER_COLOR, fontWeight: '600', marginTop: '2px' }}>
            Min order: UGX 200,000
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={onPreviewClick} 
          disabled={totalItems === 0} 
          style={{
            padding: '12px 18px',
            borderRadius: '14px',
            border: '1px solid #e5e5e5',
            background: 'white',
            color: TEXT_COLOR,
            cursor: totalItems > 0 ? 'pointer' : 'not-allowed',
            fontWeight: '600',
            fontSize: '13px',
            minHeight: '48px',
            opacity: totalItems > 0 ? 1 : 0.5
          }}
        >
          View Cart
        </button>

        <button 
          onClick={onOrderClick} 
          disabled={totalPrice < 200000} 
          style={{
            background: totalPrice >= 200000 
              ? `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #A84828 100%)` 
              : '#e5e5e5',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '14px',
            cursor: totalPrice >= 200000 ? 'pointer' : 'not-allowed',
            fontWeight: '700',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '48px',
            boxShadow: totalPrice >= 200000 ? '0 4px 16px rgba(200, 90, 50, 0.35)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <FaWhatsapp size={18} /> 
          Order
        </button>
      </div>
    </div>
  );
}
