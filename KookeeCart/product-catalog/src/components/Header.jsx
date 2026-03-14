import React from 'react';
import { FaShoppingCart, FaArrowLeft, FaSync, FaHome } from 'react-icons/fa';
import { PRIMARY_COLOR, CARD_BACKGROUND, TEXT_COLOR, LIGHT_TEXT_COLOR, ACCENT_COLOR } from '../constants/colors';

export default function Header({ isScrolled = false, filteredProductsCount = 0, totalProductsCount = 0, searchQuery = '', onSync, isSyncing }) {

  const detailStyles = {
    maxHeight: isScrolled ? '0' : '60px',
    opacity: isScrolled ? '0' : '1',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={{
      textAlign: 'center',
      padding: isScrolled ? '12px 16px' : '20px 16px',
      background: CARD_BACKGROUND,
      width: '100%',
      // predictable height for sticky stacking
      minHeight: isScrolled ? '50px' : '100px',
      transition: 'all 0.3s ease',
      position: 'relative' // For absolute positioning of sync button
    }}>
      {/* Home Link Button - Left Corner */}
      <a
        href="https://kookee.co.ug"
        style={{
          position: 'absolute',
          top: '12px',
          left: '16px',
          background: 'rgba(212, 112, 74, 0.1)',
          border: `1px solid ${PRIMARY_COLOR}`,
          color: PRIMARY_COLOR,
          padding: '8px 12px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: '600',
          minHeight: '36px',
          minWidth: '36px',
          zIndex: 10,
          transition: 'all 0.2s ease',
          textDecoration: 'none',
          cursor: 'pointer'
        }}
        title="Go to Kookee Home"
      >
        <FaHome size={14} />
        {!isScrolled && <span>Home</span>}
      </a>



      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <h1 style={{
          margin: 0,
          color: PRIMARY_COLOR,
          fontSize: isScrolled ? '20px' : '26px',
          fontWeight: 800,
          transition: 'font-size 0.3s ease',
          letterSpacing: '-0.5px'
        }}>
          <FaShoppingCart style={{ marginRight: '8px', fontSize: isScrolled ? '18px' : '22px' }} />
          Kookee Online
        </h1>
      </div>

      <div style={detailStyles}>
        <p style={{ margin: '4px 0 6px 0', fontSize: '14px', color: TEXT_COLOR, fontWeight: 500 }}>
          Premium Quality Groceries & Dairy
        </p>
      </div>

    </div>
  );
}
