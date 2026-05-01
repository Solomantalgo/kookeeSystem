import React, { useState, useEffect } from 'react';
import { FaTimes, FaArrowLeft, FaPlus, FaMinus } from 'react-icons/fa';
// Assuming DANGER_COLOR is also defined in your colors file
import { CARD_BACKGROUND, TEXT_COLOR, LIGHT_TEXT_COLOR, PRIMARY_COLOR, ACCENT_COLOR, DANGER_COLOR } from '../constants/colors';

// --- CatalogItemQuantityControl Component (Improved with Alignment) ---
function CatalogItemQuantityControl({ product, currentQuantity, updateQuantity }) {
    const [qtyInput, setQtyInput] = useState(currentQuantity.toString());

    useEffect(() => {
        setQtyInput(currentQuantity.toString());
    }, [currentQuantity]);

    const handleQtyInputChange = (value) => {
        if (value === '') {
            setQtyInput('');
            return;
        }
        if (/^\d*$/.test(value)) {
            const newQty = parseInt(value, 10);
            if (!isNaN(newQty)) {
                setQtyInput(value);
                updateQuantity(product.id, newQty - currentQuantity);
            }
        }
    };

    const handleQtyInputBlur = () => {
        const newQty = parseInt(qtyInput, 10);
        if (qtyInput === '' || isNaN(newQty)) {
            setQtyInput(currentQuantity.toString());
        } else {
            setQtyInput(newQty.toString());
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
        }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: PRIMARY_COLOR }}>
                UGX {product.price ? product.price.toLocaleString() : 'N/A'}
            </span>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#f8fafc',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => updateQuantity(product.id, -1)}
                    style={{
                        width: '32px', height: '32px',
                        background: currentQuantity > 0 ? 'white' : '#f1f5f9',
                        cursor: currentQuantity > 0 ? 'pointer' : 'not-allowed',
                        borderRadius: '8px', border: '1px solid #e2e8f0',
                        color: currentQuantity > 0 ? TEXT_COLOR : LIGHT_TEXT_COLOR,
                        display: 'flex',
                        alignItems: 'center', justifyContent: 'center', padding: 0,
                        transition: 'all 0.2s',
                        boxShadow: currentQuantity > 0 ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                    }}
                    disabled={currentQuantity === 0}
                >
                    <FaMinus size={10} />
                </button>

                <input
                    type="number"
                    value={qtyInput}
                    onChange={(e) => handleQtyInputChange(e.target.value)}
                    onBlur={handleQtyInputBlur}
                    style={{
                        width: '45px', textAlign: 'center', padding: '4px 0', border: 'none',
                        borderRadius: '6px', fontSize: '15px', fontWeight: '700', color: TEXT_COLOR,
                        backgroundColor: 'transparent',
                        outline: 'none',
                        margin: 0,
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield'
                    }}
                />

                <button
                    onClick={() => updateQuantity(product.id, 1)}
                    style={{
                        width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                        background: ACCENT_COLOR, color: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', padding: 0,
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
                    }}
                >
                    <FaPlus size={10} />
                </button>
            </div>
        </div>
    );
}


// --- Main Component: SmallCatalogView (Improved with Glow) ---
export default function SmallCatalogView({
    show, products = [], cart = {}, updateQuantity = () => { }, onClose = () => { }
}) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const categories = [...new Set(products.map(p => p.category))];

    if (!show) return null;

    const getProductsByCategory = (category) => products.filter(p => p.category === category);
    const currentProducts = selectedCategory ? getProductsByCategory(selectedCategory) : null;

    // --- NEW: Glow utility for consistent glow shadows ---
    const getGlowShadow = (color, strength = 1, isInset = false) => {
        const baseShadow = `0 0 ${6 * strength}px rgba(255, 255, 255, 0.5), 0 0 ${4 * strength}px ${color}`;
        return isInset ? `inset ${baseShadow}` : `${baseShadow}`;
    }


    // 2. **Main Premium Container**
    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
    };

    const containerStyle = {
        width: '100%', maxWidth: '440px', maxHeight: '85vh',
        background: 'white',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column'
    };

    // 3. **Header**
    const headerStyle = {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px',
        background: 'white',
        borderBottom: '1px solid #f1f5f9',
        position: 'sticky', top: 0, zIndex: 10,
    };

    // 4. **Scrollable Content Area**
    const contentAreaStyle = {
        padding: '16px 20px',
        overflowY: 'auto',
        flex: 1,
        backgroundColor: '#fff'
    };

    // 5. **Category Button (Premium Card Style)**
    const categoryButtonStyle = {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 24px',
        border: '1px solid #f1f5f9',
        borderRadius: 16,
        background: 'white',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
    };

    // --- End of Styles ---


    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={containerStyle} onClick={e => e.stopPropagation()}>

                {/* 1. GLASSY HEADER */}
                <div style={headerStyle}>
                    {selectedCategory ? (
                        <>
                            <button
                                type="button" onClick={() => setSelectedCategory(null)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: PRIMARY_COLOR, fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    fontSize: '15px', padding: '0'
                                }}
                            >
                                <FaArrowLeft /> Back to Categories
                            </button>
                            <button type="button" onClick={onClose}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: LIGHT_TEXT_COLOR }}
                            >
                                <FaTimes size={18} />
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 style={{ margin: 0, color: PRIMARY_COLOR, fontWeight: 700 }}>Quick Catalog</h3>
                            <button type="button" onClick={onClose}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: LIGHT_TEXT_COLOR }}
                            >
                                <FaTimes size={18} />
                            </button>
                        </>
                    )}
                </div>

                {/* 2. SCROLLABLE CONTENT */}
                <div style={contentAreaStyle}>
                    {selectedCategory ? (
                        <div style={{ display: 'grid', gap: 10 }}>
                            <h3 style={{ margin: '0 0 15px 0', color: TEXT_COLOR, fontWeight: 700, fontSize: '1.4em' }}>
                                {selectedCategory}
                            </h3>
                            {currentProducts.map(p => {
                                const productId = String(p.id);
                                const currentQuantity = cart[productId] || 0;

                                return (
                                    <div key={productId} style={{
                                        padding: '12px 0',
                                        borderBottom: '1px solid rgba(220, 220, 220, 0.4)',
                                        // Adding a subtle, non-intrusive hover effect via a light background change
                                        background: 'transparent',
                                        transition: 'background-color 0.2s ease'
                                    }}>
                                        {/* Product Details Block (Unchanged) */}
                                        <div style={{
                                            display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px'
                                        }}>
                                            {p.image && (
                                                <img
                                                    src={p.image} alt={p.imageAlt || p.name}
                                                    loading="lazy"
                                                    style={{
                                                        width: '60px', height: '60px', objectFit: 'contain',
                                                        borderRadius: '8px', flexShrink: 0,
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                            )}

                                            <div>
                                                <div style={{ color: TEXT_COLOR, fontWeight: 600, fontSize: '17px' }}>
                                                    {p.name}
                                                </div>
                                                <div>
                                                    {(() => {
                                                        const stockStatus = p.stock ? String(p.stock).toLowerCase() : '';
                                                        const isOutOfStock = stockStatus === 'out of stock';

                                                        return (
                                                            <span style={{
                                                                margin: '4px 0', fontSize: '14px',
                                                                color: isOutOfStock ? DANGER_COLOR : PRIMARY_COLOR,
                                                                fontWeight: isOutOfStock ? '700' : '600', display: 'block'
                                                            }}>
                                                                {isOutOfStock ? '🛑 Out of Stock' : '✅ In Stock'}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <div style={{ color: LIGHT_TEXT_COLOR, fontSize: '13px' }}>
                                                    {p.description}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. PRICE AND QUANTITY CONTROLS (Improved) */}
                                        <CatalogItemQuantityControl
                                            product={p}
                                            currentQuantity={currentQuantity}
                                            updateQuantity={updateQuantity}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // Category List
                        <div style={{ display: 'grid', gap: 12 }}>
                            {categories.map(category => {
                                const count = getProductsByCategory(category).length;
                                // Note: Achieving a dynamic :hover glow requires the use of actual CSS classes 
                                // or libraries. Here, we use the non-hovered style for inline consistency.
                                return (
                                    <button
                                        key={category} type="button" onClick={() => setSelectedCategory(category)}
                                        style={categoryButtonStyle}
                                    >
                                        <span style={{ color: PRIMARY_COLOR, fontWeight: 700, fontSize: '16px' }}>
                                            {category}
                                        </span>
                                        <span style={{
                                            color: ACCENT_COLOR, fontWeight: 800, fontSize: '15px',
                                            padding: '4px 10px', borderRadius: '8px',
                                            background: '#fff7ed', border: '1px solid #ffedd5'
                                        }}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}