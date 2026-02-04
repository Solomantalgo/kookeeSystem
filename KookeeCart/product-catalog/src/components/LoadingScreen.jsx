import React from 'react';

const PRIMARY_COLOR = '#007bff';
const BACKGROUND_COLOR = '#f8f9fa';
const LIGHT_TEXT_COLOR = '#6c757d';

const LoadingScreen = () => {
  return (
    <div style={{
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${BACKGROUND_COLOR} 0%, #dee2e6 100%)`
    }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
      <h2 style={{ color: PRIMARY_COLOR }}>Loading Products...</h2>
      <p style={{ color: LIGHT_TEXT_COLOR }}>Please wait</p>
    </div>
  );
};

export default LoadingScreen;