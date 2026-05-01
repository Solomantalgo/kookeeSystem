import React from 'react';
import { FaShoppingCart, FaHome, FaPhone, FaHistory, FaSearch, FaTimes } from 'react-icons/fa';
import { PRIMARY_COLOR, CARD_BACKGROUND, TEXT_COLOR, LIGHT_TEXT_COLOR, ACCENT_COLOR } from '../constants/colors';

export default function Header({ 
  isScrolled = false, 
  searchQuery = '', 
  setSearchQuery, 
  onShowOrderHistory, 
  orderHistoryCount = 0 
}) {

  return (
    <div style={{
      background: CARD_BACKGROUND,
      width: '100%',
      transition: 'all 0.3s ease',
      position: 'relative',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      boxShadow: isScrolled ? '0 2px 10px rgba(0,0,0,0.05)' : 'none',
      zIndex: 1000
    }}>
      {/* Top Bar: Logo and Action Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isScrolled ? '8px 16px' : '12px 16px',
        transition: 'all 0.3s ease'
      }}>
        {/* Left: Home */}
        <a
          href="https://kookee.co.ug"
          style={{
            color: PRIMARY_COLOR,
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          <FaHome size={20} />
        </a>

        {/* Center: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: isScrolled ? '28px' : '32px',
            height: isScrolled ? '28px' : '32px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${ACCENT_COLOR} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(200, 90, 50, 0.2)'
          }}>
            <FaShoppingCart style={{ color: 'white', fontSize: isScrolled ? '12px' : '14px' }} />
          </div>
          <h1 style={{
            margin: 0,
            color: TEXT_COLOR,
            fontSize: isScrolled ? '18px' : '22px',
            fontWeight: '900',
            letterSpacing: '-0.8px'
          }}>
            Kookee
          </h1>
        </div>

        {/* Right: History & Contact */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onShowOrderHistory}
            style={{
              background: '#f8fafc',
              color: TEXT_COLOR,
              border: 'none',
              padding: '8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer'
            }}
            title="Order History"
          >
            <FaHistory size={18} />
            {orderHistoryCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: PRIMARY_COLOR,
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 5px',
                borderRadius: '10px',
                border: '2px solid white'
              }}>
                {orderHistoryCount}
              </span>
            )}
          </button>

          <a
            href="tel:0759141177"
            style={{
              background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #A84828 100%)`,
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(200, 90, 50, 0.2)'
            }}
          >
            <FaPhone size={14} />
            <span style={{ fontSize: '12px', fontWeight: '700', display: isScrolled ? 'none' : 'inline' }}>Call</span>
          </a>
        </div>
      </div>

      {/* Search Bar: Embedded and Stable */}
      <div style={{
        padding: isScrolled ? '0 16px 8px 16px' : '0 16px 12px 16px',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
          <FaSearch style={{ 
            position: 'absolute', 
            left: '14px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#94a3b8',
            fontSize: '14px'
          }} />
          <input
            type="text"
            placeholder="Search premium products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 40px 12px 40px',
              border: '1.5px solid #f1f5f9',
              borderRadius: '14px',
              fontSize: '14px',
              backgroundColor: '#f8fafc',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'all 0.2s ease',
              color: TEXT_COLOR,
              fontWeight: '500'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = PRIMARY_COLOR;
              e.target.style.backgroundColor = 'white';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#f1f5f9';
              e.target.style.backgroundColor = '#f8fafc';
              e.target.style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: LIGHT_TEXT_COLOR,
                padding: '4px'
              }}
            >
              <FaTimes size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
