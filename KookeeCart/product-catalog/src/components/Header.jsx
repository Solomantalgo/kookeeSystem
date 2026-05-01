import React from 'react';
import { FaShoppingCart, FaHome, FaPhone, FaEnvelope } from 'react-icons/fa';
import { PRIMARY_COLOR, CARD_BACKGROUND, TEXT_COLOR, LIGHT_TEXT_COLOR, ACCENT_COLOR } from '../constants/colors';

export default function Header({ isScrolled = false, filteredProductsCount = 0, totalProductsCount = 0, searchQuery = '', onSync, isSyncing }) {

  const detailStyles = {
    maxHeight: isScrolled ? '0' : '50px',
    opacity: isScrolled ? '0' : '1',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={{
      textAlign: 'center',
      padding: isScrolled ? '10px 16px' : '16px',
      background: CARD_BACKGROUND,
      width: '100%',
      minHeight: isScrolled ? '50px' : '80px',
      transition: 'all 0.3s ease',
      position: 'relative',
      borderBottom: '1px solid rgba(0,0,0,0.04)'
    }}>
      {/* Home Link Button - Left Corner */}
      <a
        href="https://kookee.co.ug"
        style={{
          position: 'absolute',
          top: '50%',
          left: '16px',
          transform: 'translateY(-50%)',
          background: 'transparent',
          color: PRIMARY_COLOR,
          padding: '8px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: '600',
          zIndex: 10,
          transition: 'all 0.2s ease',
          textDecoration: 'none',
          cursor: 'pointer'
        }}
        title="Go to Kookee Home"
      >
        <FaHome size={18} />
      </a>

      {/* Contact Button - Right Corner */}
      <button
        style={{
          position: 'absolute',
          top: '50%',
          right: '16px',
          transform: 'translateY(-50%)',
          background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #A84828 100%)`,
          color: 'white',
          border: 'none',
          padding: '8px 14px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '11px',
          fontWeight: '600',
          zIndex: 10,
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(200, 90, 50, 0.3)'
        }}
        title="Contact Kookee"
      >
        <FaPhone size={10} />
        <span style={{ display: isScrolled ? 'none' : 'inline' }}>Contact</span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${ACCENT_COLOR} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(200, 90, 50, 0.3)'
        }}>
          <FaShoppingCart style={{ color: 'white', fontSize: '16px' }} />
        </div>
        <h1 style={{
          margin: 0,
          color: TEXT_COLOR,
          fontSize: isScrolled ? '18px' : '22px',
          fontWeight: '800',
          transition: 'font-size 0.3s ease',
          letterSpacing: '-0.5px'
        }}>
          Kookee
        </h1>
      </div>

      <div style={detailStyles}>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: LIGHT_TEXT_COLOR, fontWeight: '500' }}>
          Premium Groceries & Dairy in Uganda
        </p>
      </div>

    </div>
  );
}
