import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaArrowRight, FaTag } from 'react-icons/fa';
import { PRIMARY_COLOR, ACCENT_COLOR, TEXT_COLOR } from '../constants/colors';

// Brand-focused Hero Banner - Prices Removed
export default function PromotionalVideoFeed({ products = [], onProductClick }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState(new Set());
    const [loadedImages, setLoadedImages] = useState(new Set());

    // Preload promotional images
    useEffect(() => {
        products.forEach(product => {
            let cleanName = product.name ? product.name.replace(/[^a-zA-Z0-9]/g, '') : 'product';
            if (!cleanName) cleanName = 'product';
            const webpSrc = `/images/${cleanName}.webp`;
            const jpgSrc = `/images/${cleanName}.jpg`;
            
            const img = new Image();
            img.onload = () => setLoadedImages(prev => new Set([...prev, product.id]));
            img.onerror = () => {
                const fallbackImg = new Image();
                fallbackImg.onload = () => setLoadedImages(prev => new Set([...prev, product.id]));
                fallbackImg.src = jpgSrc;
            };
            img.src = webpSrc;
        });
    }, [products]);

    // Auto-rotate every 6 seconds
    useEffect(() => {
        if (products.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % products.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [products.length]);

    if (!products.length) return null;

    const product = products[currentIndex];
    const promoText = product.promoCommunicator ? String(product.promoCommunicator).trim() : '';
    const hasPromoText = promoText !== '' && promoText !== 'false' && promoText !== 'null';

    let cleanName = product.name ? product.name.replace(/[^a-zA-Z0-9]/g, '') : 'product';
    if (!cleanName) cleanName = 'product';
    const localImage = `/images/${cleanName}.jpg`;
    const hasImageError = imageErrors.has(product.id);

    const handleImageError = () => {
        setImageErrors(prev => new Set([...prev, product.id]));
    };

    const handleImageLoad = () => {
        setImageErrors(prev => {
            const newSet = new Set(prev);
            newSet.delete(product.id);
            return newSet;
        });
    };

    return (
        <div style={{
            width: '100%',
            marginBottom: '20px',
        }}>
            {/* Brand Hero Section */}
            <div style={{
                background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #8B4513 50%, ${ACCENT_COLOR} 100%)`,
                padding: '30px 24px',
                borderRadius: '24px 24px 0 0',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Decorative Elements */}
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        marginBottom: '8px'
                    }}>
                        <FaShoppingCart style={{ color: 'white', fontSize: '20px' }} />
                        <span style={{
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: '11px',
                            fontWeight: '700',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase'
                        }}>
                            Kookee Premium
                        </span>
                    </div>
                    
                    <h1 style={{
                        margin: '0 0 10px 0',
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: '900',
                        letterSpacing: '-1px',
                        lineHeight: '1.1'
                    }}>
                        Freshness<br />Delivered.
                    </h1>
                    
                    <p style={{
                        margin: '0 0 20px 0',
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '14px',
                        fontWeight: '500',
                        maxWidth: '200px'
                    }}>
                        Top-quality groceries directly to your home.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => onProductClick(product)}
                            style={{
                                background: 'white',
                                color: PRIMARY_COLOR,
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '16px',
                                fontSize: '14px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                            }}
                        >
                            View Item <FaArrowRight size={12} />
                        </button>
                        <button
                            onClick={() => {
                                const el = document.getElementById('categories-anchor');
                                if (el) {
                                    const yOffset = -140; // Account for fixed header
                                    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                    window.scrollTo({ top: y, behavior: 'smooth' });
                                }
                            }}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.4)',
                                padding: '12px 24px',
                                borderRadius: '16px',
                                fontSize: '14px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            Browse Categories
                        </button>
                    </div>
                </div>
            </div>

            {/* Promo Preview Section */}
            <div style={{
                background: '#fff',
                padding: '16px',
                borderRadius: '0 0 24px 24px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaTag style={{ color: ACCENT_COLOR }} />
                        <span style={{ color: TEXT_COLOR, fontSize: '14px', fontWeight: '800' }}>
                            Featured Promotions
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        {products.map((_, idx) => (
                            <div
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                style={{
                                    width: currentIndex === idx ? '18px' : '6px',
                                    height: '6px',
                                    borderRadius: '3px',
                                    backgroundColor: currentIndex === idx ? PRIMARY_COLOR : '#e2e8f0',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Promotional Product Card */}
                <div
                    onClick={() => onProductClick(product)}
                    style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '16px',
                        background: '#f8fafc',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        border: `1.5px solid ${PRIMARY_COLOR}`,
                        transition: 'all 0.2s ease'
                    }}
                >
                    <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                    }}>
                        {!loadedImages.has(product.id) ? (
                            <div style={{ width: '20px', height: '20px', border: '2px solid #f1f5f9', borderTopColor: PRIMARY_COLOR, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        ) : hasImageError ? (
                            <span style={{ fontSize: '24px' }}>🍎</span>
                        ) : (
                            <img
                                src={localImage}
                                alt={product.name}
                                onError={handleImageError}
                                onLoad={handleImageLoad}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {hasPromoText && (
                            <span style={{
                                background: '#fef2f2',
                                color: '#dc2626',
                                fontSize: '10px',
                                fontWeight: '800',
                                padding: '2px 8px',
                                borderRadius: '8px',
                                width: 'fit-content',
                                marginBottom: '4px',
                                textTransform: 'uppercase'
                            }}>
                                {promoText}
                            </span>
                        )}
                        <h3 style={{
                            margin: 0,
                            fontSize: '15px',
                            fontWeight: '800',
                            color: TEXT_COLOR,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {product.name}
                        </h3>
                        <div style={{ color: PRIMARY_COLOR, fontSize: '12px', fontWeight: '700', marginTop: '4px' }}>
                            Limited Time Offer
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                         <FaArrowRight color={PRIMARY_COLOR} />
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
