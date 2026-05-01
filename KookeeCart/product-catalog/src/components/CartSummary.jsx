// CartSummary.js - Improved UI - Prices Removed
import React from 'react';
import { FaWhatsapp, FaShoppingBag } from 'react-icons/fa';
import { CARD_BACKGROUND, TEXT_COLOR, LIGHT_TEXT_COLOR, PRIMARY_COLOR } from '../constants/colors';

export default function CartSummary({ totalItems = 0, onOrderClick, onPreviewClick, cartRef }) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FaShoppingBag size={14} style={{ color: PRIMARY_COLOR }} />
          <span style={{ fontSize: '16px', color: TEXT_COLOR, fontWeight: '700' }}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in cart
          </span>
        </div>
        <div style={{ fontSize: '11px', color: LIGHT_TEXT_COLOR, marginTop: '2px' }}>
          Tap Order to submit on WhatsApp
        </div>
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
          disabled={totalItems === 0} 
          style={{
            background: totalItems > 0 
              ? `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #A84828 100%)` 
              : '#e5e5e5',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '14px',
            cursor: totalItems > 0 ? 'pointer' : 'not-allowed',
            fontWeight: '700',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '48px',
            boxShadow: totalItems > 0 ? '0 4px 16px rgba(200, 90, 50, 0.35)' : 'none',
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
