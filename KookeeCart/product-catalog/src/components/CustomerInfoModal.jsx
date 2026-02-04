// CustomerInfoModal.js (10) - Customer information and order sending UI
// filepath: c:\Solomon\Projects\Clients\Kookee\KookeeCart\product-catalog\src\components\CustomerInfoModal.jsx
import React from 'react';
import { PRIMARY_COLOR, ACCENT_COLOR, BACKGROUND_COLOR, CARD_BACKGROUND, TEXT_COLOR, LIGHT_TEXT_COLOR, DANGER_COLOR } from '../constants/colors';

export default function CustomerInfoModal({ show, customerInfo, setCustomerInfo, onCancel, onSubmit, isSending, orderStatus }) {
  if (!show) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }} onClick={onCancel}>
      <style>{`
        @keyframes spin { 0%{ transform:rotate(0)} 100%{ transform:rotate(360deg)} }
        @keyframes fadeIn { from{ opacity:0; transform:translateY(10px); } to{ opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ backgroundColor: CARD_BACKGROUND, borderRadius: '24px', padding: '32px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', position: 'relative', animation: 'fadeIn 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>

        {/* Loading / Status Overlay */}
        {isSending && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            {orderStatus === null && (
              <>
                <div style={{ width: '50px', height: '50px', border: `3px solid ${BACKGROUND_COLOR}`, borderTop: `3px solid ${PRIMARY_COLOR}`, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
                <p style={{ color: PRIMARY_COLOR, fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Sending Order...</p>
              </>
            )}

            {orderStatus === 'success' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h3 style={{ color: TEXT_COLOR, fontSize: '22px', margin: '0 0 10px 0', fontWeight: 'bold' }}>Success!</h3>
                <p style={{ color: LIGHT_TEXT_COLOR, fontSize: '15px', margin: 0 }}>Order sent to WhatsApp.</p>
              </div>
            )}

            {orderStatus === 'error' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <h3 style={{ color: DANGER_COLOR, fontSize: '20px', margin: '0 0 10px 0', fontWeight: 'bold' }}>Something went wrong</h3>
                <button onClick={onCancel} style={{ marginTop: '16px', padding: '8px 24px', border: 'none', borderRadius: '50px', background: '#fef2f2', color: DANGER_COLOR, cursor: 'pointer', fontWeight: '600' }}>Close</button>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <h2 style={{ margin: '0 0 24px 0', color: TEXT_COLOR, textAlign: 'center', fontSize: '22px' }}>Checkout Details</h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: TEXT_COLOR, fontWeight: '600', fontSize: '14px' }}>Name</label>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            placeholder="Your Name"
            disabled={isSending}
            style={{
              width: '100%', padding: '14px 16px', border: '1px solid #e5e5e5', borderRadius: '50px', fontSize: '15px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f9fafb', transition: 'all 0.2s'
            }}
            onFocus={(e) => { e.target.style.borderColor = PRIMARY_COLOR; e.target.style.backgroundColor = 'white'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e5e5'; e.target.style.backgroundColor = '#f9fafb'; }}
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: TEXT_COLOR, fontWeight: '600', fontSize: '14px' }}>WhatsApp Number</label>
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
            placeholder="e.g. 0700 123 456"
            disabled={isSending}
            style={{
              width: '100%', padding: '14px 16px', border: '1px solid #e5e5e5', borderRadius: '50px', fontSize: '15px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f9fafb', transition: 'all 0.2s'
            }}
            onFocus={(e) => { e.target.style.borderColor = PRIMARY_COLOR; e.target.style.backgroundColor = 'white'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e5e5'; e.target.style.backgroundColor = '#f9fafb'; }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} disabled={isSending} style={{ flex: 1, padding: '14px', border: '1px solid #e5e5e5', borderRadius: '50px', background: 'white', color: LIGHT_TEXT_COLOR, cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}>
            Cancel
          </button>
          <button onClick={onSubmit} disabled={isSending} style={{ flex: 1, padding: '14px', border: 'none', borderRadius: '50px', background: ACCENT_COLOR, color: 'white', cursor: isSending ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)' }}>
            Complete Order
          </button>
        </div>
      </div>
    </div>
  );
}
