import React, { useState } from 'react';
import { FaSearch, FaHistory, FaTimes } from 'react-icons/fa';
import { PRIMARY_COLOR, CARD_BACKGROUND, LIGHT_TEXT_COLOR, TEXT_COLOR } from '../constants/colors';

export default function MenuTabs({
  searchQuery, setSearchQuery,
  orderHistory = [],
  onShowOrderHistory,
  isScrolled = false
}) {
  const [activeTab, setActiveTab] = useState(null); // null, 'search', 'orders'

  const handleTabClick = (tab) => {
    if (activeTab === tab) {
      setActiveTab(null); // Close if already open
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div style={{
      backgroundColor: CARD_BACKGROUND,
      borderBottom: '1px solid #e5e5e5',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      width: '100%',
      padding: isScrolled ? '8px 16px' : '12px 16px',
      transition: 'padding 0.3s ease'
    }}>
      {/* Tab Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <button
          onClick={() => handleTabClick('search')}
          style={{
            flex: 1,
            padding: isScrolled ? '8px 12px' : '12px 16px',
            border: 'none',
            borderRadius: '12px',
            background: activeTab === 'search' ? PRIMARY_COLOR : '#f9f9f9',
            color: activeTab === 'search' ? 'white' : TEXT_COLOR,
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: isScrolled ? '12px' : '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            minHeight: isScrolled ? '36px' : '44px'
          }}
        >
          <FaSearch /> Search Catalog
        </button>

        <button
          onClick={() => handleTabClick('orders')}
          style={{
            flex: 1,
            padding: isScrolled ? '8px 12px' : '12px 16px',
            border: 'none',
            borderRadius: '12px',
            background: activeTab === 'orders' ? PRIMARY_COLOR : '#f9f9f9',
            color: activeTab === 'orders' ? 'white' : TEXT_COLOR,
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: isScrolled ? '12px' : '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            minHeight: isScrolled ? '36px' : '44px'
          }}
        >
          <FaHistory /> Order History ({orderHistory.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'search' && (
        <div style={{
          padding: '16px',
          backgroundColor: CARD_BACKGROUND,
          borderTop: '1px solid #f0f0f0'
        }}>
          <div style={{ position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: LIGHT_TEXT_COLOR, zIndex: 1 }} />
            <input
              type="text"
              placeholder="What are you looking for?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              style={{
                width: '100%',
                padding: '14px 14px 14px 44px',
                border: '1px solid #f0f0f0',
                borderRadius: '50px',
                fontSize: '15px',
                backgroundColor: '#f9f9f9',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 0.2s ease',
                minHeight: '44px'
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
                  fontSize: '14px',
                  padding: '4px',
                  minHeight: '44px',
                  minWidth: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div style={{
          padding: '16px',
          backgroundColor: CARD_BACKGROUND,
          borderTop: '1px solid #f0f0f0'
        }}>
          <button
            onClick={() => {
              onShowOrderHistory();
              setActiveTab(null);
            }}
            style={{
              width: '100%',
              padding: '14px',
              border: `1px solid ${PRIMARY_COLOR}`,
              borderRadius: '12px',
              background: PRIMARY_COLOR,
              color: 'white',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '15px',
              minHeight: '44px',
              transition: 'all 0.2s ease'
            }}
          >
            View Past Orders ({orderHistory.length})
          </button>
        </div>
      )}
    </div>
  );
}