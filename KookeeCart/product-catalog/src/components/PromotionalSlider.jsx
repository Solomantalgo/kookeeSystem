import React from 'react';
import { PRIMARY_COLOR, TEXT_COLOR, CARD_BACKGROUND } from '../constants/colors';
import ProductCard from './ProductCard';

export default function PromotionalSlider({ products, cart, updateQuantity, onProductClick }) {
    if (!products || products.length === 0) return null;

    return (
        <div style={{ marginBottom: '24px' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                marginBottom: '12px'
            }}>
                <h2 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: TEXT_COLOR,
                    margin: 0
                }}>
                    🔥 Featured Deals
                </h2>
            </div>

            <div style={{
                display: 'flex',
                overflowX: 'auto',
                overflowY: 'hidden',
                gap: '16px',
                padding: '0 16px 20px 16px',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none', // Hide scrollbar for cleaner look
                msOverflowStyle: 'none',
                maxWidth: '100%',
                width: '100%'
            }}>
                <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

                {products.map(product => (
                    <div key={product.id} style={{
                        minWidth: '200px',
                        maxWidth: '200px',
                        scrollSnapAlign: 'start'
                    }}>
                        <ProductCard
                            product={product}
                            cart={cart}
                            updateQuantity={updateQuantity}
                            onProductClick={onProductClick}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
