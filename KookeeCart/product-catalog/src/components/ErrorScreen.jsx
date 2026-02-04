import React from 'react';
import { FaUndo } from 'react-icons/fa';

const PRIMARY_COLOR = '#007bff';
const DANGER_COLOR = '#dc3545';
const BACKGROUND_COLOR = '#f8f9fa';
const CARD_BACKGROUND = '#ffffff';
const TEXT_COLOR = '#343a40';

const ErrorScreen = ({ error }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: `linear-gradient(135deg, ${BACKGROUND_COLOR} 0%, #dee2e6 100%)`
    }}>
      <div style={{
        textAlign: 'center',
        backgroundColor: CARD_BACKGROUND,
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
        maxWidth: '500px'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '15px', color: DANGER_COLOR }}>⚠️</div>
        <h2 style={{ color: DANGER_COLOR, marginBottom: '10px' }}>Error Loading Products</h2>
        <p style={{ color: TEXT_COLOR, marginBottom: '25px' }}>{error}</p>
        <button
          style={{
            backgroundColor: PRIMARY_COLOR,
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
          onClick={() => window.location.reload()}
        >
          <FaUndo style={{ marginRight: '8px' }} /> Try Again
        </button>
      </div>
    </div>
  );
};

export default ErrorScreen;
