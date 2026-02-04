// OrderHistoryModal.js (11) - Displays saved order history
// filepath: c:\Solomon\Projects\Clients\Kookee\KookeeCart\product-catalog\src\components\OrderHistoryModal.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { CARD_BACKGROUND, TEXT_COLOR, LIGHT_TEXT_COLOR, PRIMARY_COLOR } from '../constants/colors';

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
                <div style={{ marginBottom: '10px', fontSize: '12px', color: LIGHT_TEXT_COLOR }}>{order.date}</div>
                <div style={{ marginBottom: '10px' }}><strong>{order.customer.name}</strong> ({order.customer.phone})</div>
                {order.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '14px', color: TEXT_COLOR }}>{item.name} × {item.qty} - UGX {(item.price * item.qty).toLocaleString()}</div>
                ))}
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee', fontWeight: 'bold', color: PRIMARY_COLOR }}>
                  Total: UGX {order.total.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}