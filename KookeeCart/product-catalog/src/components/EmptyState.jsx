// EmptyState.js (15) - No results / empty search state
// filepath: c:\Solomon\Projects\Clients\Kookee\KookeeCart\product-catalog\src\components\EmptyState.js
import React from 'react';

const CARD_BACKGROUND = '#ffffff';
const TEXT_COLOR = '#343a40';
const LIGHT_TEXT_COLOR = '#6c757d';
const PRIMARY_COLOR = '#007bff';

export default function EmptyState({ onClearFilters }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 15px',
      backgroundColor: CARD_BACKGROUND,
      borderRadius: '10px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
      margin: '15px'
    }}>
      <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔍</div>
      <h3 style={{ color: TEXT_COLOR, marginBottom: '8px' }}>No products found</h3>
      <p style={{ color: LIGHT_TEXT_COLOR, marginBottom: '15px' }}>Try adjusting your search or filters</p>
      <button onClick={onClearFilters} style={{
        padding: '8px 16px', border: 'none', borderRadius: '6px', background: PRIMARY_COLOR, color: 'white', cursor: 'pointer', fontWeight: 'bold'
      }}>Clear All Filters</button>
    </div>
  );
}