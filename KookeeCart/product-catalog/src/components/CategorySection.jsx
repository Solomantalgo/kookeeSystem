import React from 'react';
import { FaArrowRight } from 'react-icons/fa';
import { PRIMARY_COLOR, LIGHT_TEXT_COLOR, ACCENT_COLOR, TEXT_COLOR } from '../constants/colors';
import { getCategoryTheme } from '../constants/categoryThemes';
import ProductCard from './ProductCard.jsx';

// --- Utility Function for Consistent Glow Effect ---
const getGlowShadow = (color, strength = 1) =>
  `0 0 ${8 * strength}px rgba(255, 255, 255, 0.5), 0 0 ${5 * strength}px ${color}`;

export default function CategorySection({
  categoryName,
  products = [],
  onViewAll = () => { },
  showAll = false,
  cart,
  updateQuantity,
  onProductClick,
  maxProducts = 12
}) {
  const categoryProducts = products;

  // --- Full Product Grid Render ---
  if (showAll) {
    const displayProducts = maxProducts > 0 ? products.slice(0, maxProducts) : products;
    return (
      <div>
        <div style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          padding: '20px 0'
        }}>
          {displayProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              cart={cart}
              updateQuantity={updateQuantity}
              onProductClick={onProductClick}
            />
          ))}
        </div>
        {maxProducts > 0 && products.length > maxProducts && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <button 
              onClick={() => onViewAll(categoryName)}
              style={{
                backgroundColor: PRIMARY_COLOR,
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Load More Products ({products.length - maxProducts} remaining)
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!categoryProducts || categoryProducts.length === 0) return null;

  const featuredProduct = categoryProducts[0];
  const totalItems = categoryProducts.length;

  // Get African-inspired theme for this category
  const theme = getCategoryTheme(categoryName);

  // 🌍 AFRICAN-INSPIRED CATEGORY CARD STYLE
  const cardStyle = {
    padding: '5px',
    borderRadius: '20px',
    height: '100%',

    // Category-specific gradient background
    background: theme.gradient,
    backgroundColor: theme.cardBackground,

    // Pattern overlay
    backgroundImage: theme.pattern ? `url("${theme.pattern}")` : 'none',
    backgroundBlend: 'overlay',

    // Subtle blur for depth
    backdropFilter: 'blur(10px) saturate(120%)',
    WebkitBackdropFilter: 'blur(10px) saturate(120%)',

    // Warm border
    border: '2px solid rgba(255, 255, 255, 0.5)',

    // Layered shadows for depth
    boxShadow: `
      0 8px 24px 0 rgba(0, 0, 0, 0.15),
      inset 0 0 20px rgba(255, 255, 255, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset
    `,

    transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  };

  const handleMouseOver = (e) => {
    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
    e.currentTarget.style.boxShadow = `
      0 16px 32px 0 rgba(0, 0, 0, 0.2),
      inset 0 0 30px rgba(255, 255, 255, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.2) inset
    `;
  };

  const handleMouseOut = (e) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
    e.currentTarget.style.boxShadow = cardStyle.boxShadow;
  };

  return (
    <div
      style={cardStyle}
      onClick={() => onViewAll(categoryName)}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      {/* Subtle gradient overlay for extra depth */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)',
        pointerEvents: 'none',
        borderRadius: '20px 20px 0 0'
      }} />

      {/* Featured Image Container */}
      <div style={{
        width: '100%',
        height: '140px',
        marginBottom: '12px',
        overflow: 'hidden',
        borderRadius: '16px',
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '10px'
      }}>
        <img
          src={featuredProduct.image}
          alt={categoryName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transition: 'transform 0.3s ease',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />

        {/* View All Badge */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, ${PRIMARY_COLOR} 100%)`,
          color: 'white',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(5px)'
        }}>
          View All
          <FaArrowRight size={10} />
        </div>
      </div>

      {/* Text Details */}
      <h3 style={{
        margin: '0 0 6px 0',
        color: TEXT_COLOR,
        fontSize: '19px',
        fontWeight: 700,
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(255, 255, 255, 0.5)'
      }}>
        {categoryName}
      </h3>
      <p style={{
        margin: 0,
        fontSize: '13px',
        color: LIGHT_TEXT_COLOR,
        textAlign: 'center',
        fontWeight: '600'
      }}>
        <strong>{totalItems}</strong> items available
      </p>
    </div>
  );
}