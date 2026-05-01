import React, { useState, useEffect } from 'react';
import { PRIMARY_COLOR, ACCENT_COLOR, DANGER_COLOR, BACKGROUND_COLOR, CARD_BACKGROUND, TEXT_COLOR, LIGHT_TEXT_COLOR } from '../constants/colors';
import { FaMapMarkerAlt, FaCheckCircle, FaSpinner, FaTimesCircle } from 'react-icons/fa';

const CustomerInfoModal = ({ 
  show, 
  customerInfo, 
  setCustomerInfo, 
  onCancel, 
  onSubmit, 
  isSending, 
  orderStatus 
}) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [confirmLocation, setConfirmLocation] = useState(false);

  // Automatic Location Detection on Open
  useEffect(() => {
    if (show && !customerInfo.location) {
      // Small delay to ensure modal is fully rendered and not considered an overlay
      const timer = setTimeout(() => {
        handleGetLocation();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show) return null;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);
    setConfirmLocation(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setCustomerInfo(prev => ({ ...prev, location: googleMapsUrl }));
        setIsGettingLocation(false);
        setConfirmLocation(true); // Show confirmation UI
      },
      (error) => {
        console.error("Location error:", error);
        let msg = "Could not get location. ";
        if (error.code === 1) {
          msg = "Permission denied. Please check your browser settings or close any screen overlays/bubbles and try again.";
        } else if (error.code === 3) {
          msg = "Location request timed out. Please try again.";
        }
        setLocationError(msg);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleRejectLocation = () => {
    setCustomerInfo(prev => ({ ...prev, location: '' }));
    setConfirmLocation(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onCancel}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{
        backgroundColor: CARD_BACKGROUND,
        borderRadius: '20px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}>
        
        {isSending && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}>
            {orderStatus === null && (
              <>
                <div style={{
                  width: '40px', height: '40px',
                  border: `3px solid ${BACKGROUND_COLOR}`,
                  borderTop: `3px solid ${PRIMARY_COLOR}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '16px'
                }} />
                <p style={{ color: PRIMARY_COLOR, fontWeight: '700' }}>Redirecting to WhatsApp...</p>
              </>
            )}
          </div>
        )}

        <h2 style={{ margin: '0 0 20px 0', color: TEXT_COLOR, fontSize: '20px', fontWeight: '900' }}>Order Details</h2>
        
        {/* Name Input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: TEXT_COLOR, fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px' }}>
            YOUR NAME *
          </label>
          <input
            type="text"
            value={customerInfo.name || ''}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            placeholder="e.g. John Doe"
            disabled={isSending}
            style={{
              width: '100%', padding: '12px 16px',
              border: '1.5px solid #f1f5f9',
              borderRadius: '12px', fontSize: '15px',
              boxSizing: 'border-box', outline: 'none',
              backgroundColor: '#f8fafc'
            }}
          />
        </div>

        {/* Phone Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: TEXT_COLOR, fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px' }}>
            PHONE NUMBER *
          </label>
          <input
            type="tel"
            value={customerInfo.phone || ''}
            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
            placeholder="e.g. 0759XXXXXX"
            disabled={isSending}
            style={{
              width: '100%', padding: '12px 16px',
              border: '1.5px solid #f1f5f9',
              borderRadius: '12px', fontSize: '15px',
              boxSizing: 'border-box', outline: 'none',
              backgroundColor: '#f8fafc'
            }}
          />
        </div>

        {/* Location Section */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: TEXT_COLOR, fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px' }}>
            DELIVERY LOCATION *
          </label>
          
          <div style={{
            padding: '16px',
            borderRadius: '16px',
            background: confirmLocation ? '#f0fdf4' : '#f8fafc',
            border: confirmLocation ? `1.5px solid #bcf0da` : '1.5px dashed #e2e8f0',
            transition: 'all 0.3s ease'
          }}>
            {isGettingLocation ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: PRIMARY_COLOR }}>
                <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Fetching your location...</span>
              </div>
            ) : confirmLocation ? (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', marginBottom: '12px' }}>
                  <FaCheckCircle size={18} />
                  <span style={{ fontWeight: '700', fontSize: '14px' }}>Location detected!</span>
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#374151', lineHeight: '1.4' }}>
                  Do you need your items delivered at this current place?
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setConfirmLocation(false)}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Yes, Correct
                  </button>
                  <button
                    onClick={handleRejectLocation}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #dc2626', background: 'transparent', color: '#dc2626', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                  >
                    No, Change
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {customerInfo.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', marginBottom: '12px' }}>
                    <FaCheckCircle size={16} />
                    <span style={{ fontWeight: '700', fontSize: '13px' }}>Location Confirmed</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isSending}
                  style={{
                    width: '100%', padding: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    borderRadius: '10px', border: customerInfo.location ? '1px solid #e2e8f0' : 'none',
                    background: customerInfo.location ? 'white' : PRIMARY_COLOR, 
                    color: customerInfo.location ? TEXT_COLOR : 'white',
                    cursor: 'pointer', fontWeight: '700', fontSize: '13px'
                  }}
                >
                  <FaMapMarkerAlt /> {customerInfo.location ? 'Auto-Detect Again' : 'Auto-Detect Location'}
                </button>
                {locationError && (
                  <div style={{ marginTop: '12px', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ color: DANGER_COLOR, fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                      <FaTimesCircle /> {locationError}
                    </div>
                    
                    <div style={{ 
                      background: '#fff', 
                      border: '1px solid #fee2e2', 
                      borderRadius: '10px', 
                      padding: '12px',
                      fontSize: '12px'
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontWeight: '700', color: TEXT_COLOR }}>How to enable location:</p>
                      <ol style={{ margin: 0, paddingLeft: '18px', color: LIGHT_TEXT_COLOR, lineHeight: '1.5' }}>
                        <li>Tap the <b>Lock/Settings icon</b> in the browser address bar.</li>
                        <li>Select <b>Site Settings</b> or <b>Permissions</b>.</li>
                        <li>Find <b>Location</b> and set it to <b>Allow</b>.</li>
                        <li>Close any chat bubbles (like Messenger).</li>
                      </ol>
                      <button 
                        onClick={() => window.location.reload()}
                        style={{
                          marginTop: '10px',
                          width: '100%',
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Refresh to Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <textarea
            value={customerInfo.address || ''}
            onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
            placeholder="Detailed address (Apartment, House No., Landmark)..."
            disabled={isSending}
            rows={2}
            style={{
              width: '100%', padding: '12px 16px',
              border: '1.5px solid #f1f5f9',
              borderRadius: '12px', fontSize: '14px',
              boxSizing: 'border-box', outline: 'none',
              marginTop: '12px', resize: 'none',
              backgroundColor: '#f8fafc'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            disabled={isSending}
            style={{
              flex: 1, padding: '14px',
              border: 'none', borderRadius: '14px',
              background: '#f1f5f9', color: TEXT_COLOR,
              cursor: 'pointer', fontWeight: '700'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (customerInfo.name?.trim() && customerInfo.phone?.trim() && (customerInfo.location || customerInfo.address?.trim())) {
                onSubmit();
              } else {
                alert('Please provide your name, phone and location/address.');
              }
            }}
            disabled={isSending}
            style={{
              flex: 1.5, padding: '14px',
              border: 'none', borderRadius: '14px',
              background: PRIMARY_COLOR, color: 'white',
              cursor: 'pointer', fontWeight: '800',
              boxShadow: '0 8px 20px rgba(200, 90, 50, 0.3)'
            }}
          >
            Order on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoModal;
