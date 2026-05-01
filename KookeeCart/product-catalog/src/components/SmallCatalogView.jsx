import React, { useState, useEffect } from 'react';
import { FaTimes, FaArrowLeft, FaPlus, FaMinus } from 'react-icons/fa';
import { CARD_BACKGROUND, TEXT_COLOR, LIGHT_TEXT_COLOR, PRIMARY_COLOR, ACCENT_COLOR, DANGER_COLOR } from '../constants/colors';

// --- CatalogItemQuantityControl Component ---
function CatalogItemQuantityControl({ product, currentQuantity, updateQuantity }) {
    const [qtyInput, setQtyInput] = useState(currentQuantity.toString());

    useEffect(() => {
        setQtyInput(currentQuantity.toString());
    }, [currentQuantity]);

    const handleQtyInputChange = (value) => {
        setQtyInput(value);
        updateQuantity(product.id, value);
    };

    const handleQtyInputBlur = () => {
        if (qtyInput === '') {
            setQtyInput(currentQuantity.toString());
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
        }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: TEXT_COLOR }}>
                Quantity
            </span>
            
            {(!currentQuantity && currentQuantity !== "") ? (
                <button
                    onClick={() => updateQuantity(product.id, "")}
                    style={{
                        padding: '6px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: PRIMARY_COLOR,
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer'
                    }}
                >
                    Add
                </button>
            ) : (
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
                            background: (currentQuantity > 0 || currentQuantity === "") ? 'white' : '#f1f5f9',
                            cursor: (currentQuantity > 0 || currentQuantity === "") ? 'pointer' : 'not-allowed',
                            borderRadius: '8px', border: '1px solid #e2e8f0',
                            color: (currentQuantity > 0 || currentQuantity === "") ? TEXT_COLOR : LIGHT_TEXT_COLOR,
                            display: 'flex',
                            alignItems: 'center', justifyContent: 'center', padding: 0,
                            transition: 'all 0.2s',
                        }}
                    >
                        <FaMinus size={10} />
                    </button>

                    <input
                        type="text"
                        autoFocus
                        value={qtyInput}
                        onChange={(e) => handleQtyInputChange(e.target.value)}
                        onBlur={handleQtyInputBlur}
                        style={{
                            width: '60px', textAlign: 'center', padding: '4px 0', border: 'none',
                            fontSize: '15px', fontWeight: '700', color: TEXT_COLOR,
                            backgroundColor: 'transparent',
                            outline: 'none',
                        }}
                        placeholder="0"
                    />

                    <button
                        onClick={() => updateQuantity(product.id, 1)}
                        style={{
                            width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                            background: PRIMARY_COLOR, color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', padding: 0,
                        }}
                    >
                        <FaPlus size={10} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default function SmallCatalogView({
    show, products = [], cart = {}, updateQuantity = () => { }, onClose = () => { }
}) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const categories = [...new Set(products.map(p => p.category))];

    if (!show) return null;

    const getProductsByCategory = (category) => products.filter(p => p.category === category);
    const currentProducts = selectedCategory ? getProductsByCategory(selectedCategory) : null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }} onClick={onClose}>
            <div style={{
                width: '100%', maxWidth: '440px', maxHeight: '85vh',
                background: 'white',
                borderRadius: 24,
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column'
            }} onClick={e => e.stopPropagation()}>

                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px 24px',
                    background: 'white',
                    borderBottom: '1px solid #f1f5f9',
                }}>
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
                                <FaArrowLeft /> Categories
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

                <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, backgroundColor: '#fff' }}>
                    {selectedCategory ? (
                        <div style={{ display: 'grid', gap: 10 }}>
                            <h4 style={{ margin: '0 0 15px 0', color: TEXT_COLOR, fontWeight: 700 }}>
                                {selectedCategory}
                            </h4>
                            {currentProducts.map(p => {
                                const productId = String(p.id);
                                const currentQuantity = cart[productId] !== undefined ? cart[productId] : 0;
                                const isOutOfStock = p.stock && String(p.stock).toLowerCase() === 'out of stock';

                                return (
                                    <div key={productId} style={{
                                        padding: '12px 0',
                                        borderBottom: '1px solid #f1f5f9',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            {p.image && (
                                                <img
                                                    src={p.image} alt={p.name}
                                                    style={{
                                                        width: '50px', height: '50px', objectFit: 'contain',
                                                        borderRadius: '8px', flexShrink: 0,
                                                        background: '#f8fafc', padding: '4px'
                                                    }}
                                                />
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: TEXT_COLOR, fontWeight: 600, fontSize: '15px' }}>{p.name}</div>
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: isOutOfStock ? DANGER_COLOR : '#059669',
                                                    fontWeight: '700'
                                                }}>
                                                    {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {!isOutOfStock && (
                                            <CatalogItemQuantityControl
                                                product={p}
                                                currentQuantity={currentQuantity}
                                                updateQuantity={updateQuantity}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {categories.map(category => {
                                const count = products.filter(p => p.category === category).length;
                                return (
                                    <button
                                        key={category} type="button" onClick={() => setSelectedCategory(category)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '16px 20px',
                                            border: '1px solid #f1f5f9',
                                            borderRadius: 16,
                                            background: 'white',
                                            cursor: 'pointer', width: '100%',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <span style={{ color: TEXT_COLOR, fontWeight: 700, fontSize: '15px' }}>{category}</span>
                                        <span style={{
                                            color: PRIMARY_COLOR, fontWeight: 800, fontSize: '13px',
                                            padding: '4px 10px', borderRadius: '8px',
                                            background: '#fef2f2'
                                        }}>{count} items</span>
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