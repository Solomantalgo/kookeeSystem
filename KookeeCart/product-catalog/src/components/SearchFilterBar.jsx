import React from 'react';
import { FaSearch, FaTimes, FaFilter } from 'react-icons/fa';
import { PRIMARY_COLOR, CARD_BACKGROUND, LIGHT_TEXT_COLOR, TEXT_COLOR } from '../constants/colors';

export default function SearchFilterBar({
  searchQuery, setSearchQuery,
  priceRange, setPriceRange,
  showFilters, setShowFilters,
  products = [],
  orderHistory = [],
  onShowOrderHistory
}) {
  return (
    <div style={{
      backgroundColor: CARD_BACKGROUND,
      padding: '16px',
      borderRadius: '24px', // More rounded
      marginBottom: '24px',
      border: '1px solid #e5e5e5',
      // No shadow for a cleaner look
    }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
          <FaSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: LIGHT_TEXT_COLOR }} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            style={{
              width: '100%',
              padding: '14px 14px 14px 44px',
              border: '1px solid #f0f0f0',
              borderRadius: '50px', // Pill shape
              fontSize: '15px',
              backgroundColor: '#f9f9f9',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = PRIMARY_COLOR;
              e.target.style.backgroundColor = 'white';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#f0f0f0';
              e.target.style.backgroundColor = '#f9f9f9';
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: LIGHT_TEXT_COLOR, fontSize: '14px' }}>
              <FaTimes />
            </button>
          )}
        </div>

        <button onClick={() => setShowFilters(!showFilters)} style={{
          padding: '12px 24px',
          border: `1px solid ${showFilters ? PRIMARY_COLOR : '#e5e5e5'}`,
          borderRadius: '50px',
          background: showFilters ? PRIMARY_COLOR : 'white',
          color: showFilters ? 'white' : TEXT_COLOR,
          cursor: 'pointer',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          transition: 'all 0.2s ease'
        }}>
          <FaFilter /> Filters
        </button>

        <button onClick={onShowOrderHistory} style={{
          padding: '12px 24px',
          border: '1px solid #e5e5e5',
          borderRadius: '50px',
          background: 'white',
          color: PRIMARY_COLOR,
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          My Orders ({orderHistory.length})
        </button>
      </div>

      {showFilters && (
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0f0f0', animation: 'fadeIn 0.3s ease' }}>
          <h4 style={{ margin: '0 0 12px 0', color: TEXT_COLOR, fontSize: '15px' }}>Price Range</h4>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <input type="number"
                value={priceRange.min}
                placeholder="Min"
                onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                style={{ padding: '10px 16px', border: '1px solid #eee', borderRadius: '50px', width: '100px', fontSize: '14px', outline: 'none', backgroundColor: '#fafafa' }}
                onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                onBlur={(e) => e.target.style.borderColor = '#eee'}
              />
            </div>
            <span style={{ color: LIGHT_TEXT_COLOR }}>-</span>
            <div>
              <input type="number"
                value={priceRange.max}
                placeholder="Max"
                onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                style={{ padding: '10px 16px', border: '1px solid #eee', borderRadius: '50px', width: '100px', fontSize: '14px', outline: 'none', backgroundColor: '#fafafa' }}
                onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                onBlur={(e) => e.target.style.borderColor = '#eee'}
              />
            </div>

            <div style={{ marginLeft: 'auto', fontSize: '13px', color: LIGHT_TEXT_COLOR }}>
              {priceRange.min.toLocaleString()} - {priceRange.max.toLocaleString()} UGX
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
