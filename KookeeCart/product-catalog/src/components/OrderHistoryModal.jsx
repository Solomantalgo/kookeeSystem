import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { CARD_BACKGROUND, TEXT_COLOR, LIGHT_TEXT_COLOR } from '../constants/colors';

export default function OrderHistoryModal({ show, orderHistory = [], onClose }) {
  if (!show) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: CARD_BACKGROUND, borderRadius: '12px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: CARD_BACKGROUND }}>
          <h2 style={{ margin: 0, color: TEXT_COLOR }}>Order History</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: TEXT_COLOR }}><FaTimes /></button>
        </div>

        <div style={{ padding: '20px' }}>
          {orderHistory.length === 0 ? (
            <p style={{ textAlign: 'center', color: LIGHT_TEXT_COLOR }}>No orders yet</p>
          ) : (
            orderHistory.slice().reverse().map((order, idx) => (
              <div key={idx} style={{ padding: '15px', marginBottom: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
                <div style={{ marginBottom: '6px', fontSize: '11px', color: LIGHT_TEXT_COLOR, fontWeight: '600' }}>{order.date}</div>
                <div style={{ marginBottom: '10px', fontSize: '14px' }}>
                  <strong>{order.customer.name}</strong> 
                  <span style={{ margin: '0 8px', color: '#ccc' }}>|</span>
                  <span style={{ color: LIGHT_TEXT_COLOR }}>{order.customer.phone}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ fontSize: '13px', color: TEXT_COLOR, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.name}</span>
                      <span style={{ fontWeight: '700', color: LIGHT_TEXT_COLOR }}>× {item.qty}</span>
                    </div>
                  ))}
                </div>
                
                {order.customer.location && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#0ea5e9' }}>
                    📍 Delivery Location Linked
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}