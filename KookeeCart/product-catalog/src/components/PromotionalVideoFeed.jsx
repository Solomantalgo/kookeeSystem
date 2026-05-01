import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaArrowRight, FaTag, FaPercent } from 'react-icons/fa';
import { PRIMARY_COLOR, ACCENT_COLOR, TEXT_COLOR } from '../constants/colors';

// Brand-focused Hero Banner
// - Displays brand identity prominently
// - Shows promotional products in a carousel below
// - Call-to-action buttons
export default function PromotionalVideoFeed({ products = [], onProductClick }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState(new Set());
    const [loadedImages, setLoadedImages] = useState(new Set());

    // Preload promotional images
    useEffect(() => {
        products.forEach(product => {
            const cleanName = product.name ? product.name.replace(/[^a-zA-Z0-9]/g, '') : 'product';
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

    // Auto-rotate every 5 seconds
    useEffect(() => {
        if (products.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % products.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [products.length]);

    if (!products.length) return null;

    const product = products[currentIndex];
    const currentPrice = Number(product.price) || 0;
    const originalPrice = Number(product.cutPrice) || 0;
    const hasDiscount = originalPrice > 0 && originalPrice > currentPrice;
    const promoText = product.promoCommunicator ? String(product.promoCommunicator).trim() : '';
    const hasPromoText = promoText !== '' && promoText !== 'false' && promoText !== 'null';

    const cleanName = product.name ? product.name.replace(/[^a-zA-Z0-9]/g, '') : 'product';
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
                padding: '24px 20px',
                borderRadius: '20px 20px 0 0',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Decorative circles */}
                <div style={{
                    position: 'absolute',
                    top: '-30px',
                    right: '-30px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: '10%',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        marginBottom: '8px'
                    }}>
                        <FaShoppingCart style={{ color: 'white', fontSize: '24px' }} />
                        <span style={{
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: '12px',
                            fontWeight: '600',
                            letterSpacing: '2px',
                            textTransform: 'uppercase'
                        }}>
                            Premium Groceries & Dairy
                        </span>
                    </div>
                    
                    <h1 style={{
                        margin: '0 0 8px 0',
                        color: 'white',
                        fontSize: '28px',
                        fontWeight: '900',
                        letterSpacing: '-0.5px',
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}>
                        Kookee Online
                    </h1>
                    
                    <p style={{
                        margin: 0,
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        Fresh products delivered to your door
                    </p>

                    {/* CTA Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '16px',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => onProductClick(product)}
                            style={{
                                background: 'white',
                                color: PRIMARY_COLOR,
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '25px',
                                fontSize: '14px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                            }}
                        >
                            Shop Now <FaArrowRight size={12} />
                        </button>
                        <button
                            onClick={() => {
                                const el = document.getElementById('categories');
                                el?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.4)',
                                padding: '10px 20px',
                                borderRadius: '25px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                backdropFilter: 'blur(5px)'
                            }}
                        >
                            Browse Categories
                        </button>
                    </div>
                </div>
            </div>

            {/* Promo Carousel Section */}
            <div style={{
                background: '#fff',
                padding: '16px',
                borderRadius: '0 0 20px 20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <FaTag style={{ color: ACCENT_COLOR }} />
                        <span style={{
                            color: TEXT_COLOR,
                            fontSize: '14px',
                            fontWeight: '700'
                        }}>
                            Today's Special Offers
                        </span>
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '6px'
                    }}>
                        {products.map((_, idx) => (
                            <div
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                style={{
                                    width: currentIndex === idx ? '16px' : '6px',
                                    height: '6px',
                                    borderRadius: '3px',
                                    backgroundColor: currentIndex === idx ? ACCENT_COLOR : '#ddd',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Product Card */}
                <div
                    onClick={() => onProductClick(product)}
                    style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '12px',
                        background: '#fafafa',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        border: `1px solid ${currentIndex === 0 ? PRIMARY_COLOR : 'transparent'}`
                    }}
                >
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        {!loadedImages.has(product.id) ? (
                            <div style={{
                                width: '20px',
                                height: '20px',
                                border: '2px solid #ddd',
                                borderTopColor: PRIMARY_COLOR,
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                        ) : hasImageError ? (
                            <span style={{ fontSize: '24px' }}>📦</span>
                        ) : (
                            <img
                                src={localImage}
                                alt={product.name}
                                onError={handleImageError}
                                onLoad={handleImageLoad}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            display: 'flex',
                            gap: '6px',
                            marginBottom: '4px',
                            flexWrap: 'wrap'
                        }}>
                            {hasDiscount && (
                                <span style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    padding: '2px 8px',
                                    borderRadius: '10px'
                                }}>
                                    <FaPercent size={8} style={{ marginRight: '3px' }} />
                                    {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
                                </span>
                            )}
                            {hasPromoText && (
                                <span style={{
                                    background: PRIMARY_COLOR,
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    padding: '2px 8px',
                                    borderRadius: '10px'
                                }}>
                                    {promoText}
                                </span>
                            )}
                        </div>
                        <h3 style={{
                            margin: 0,
                            fontSize: '14px',
                            fontWeight: '700',
                            color: TEXT_COLOR,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {product.name}
                        </h3>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '4px'
                        }}>
                            {hasDiscount ? (
                                <>
                                    <span style={{
                                        textDecoration: 'line-through',
                                        color: '#999',
                                        fontSize: '12px'
                                    }}>
                                        UGX {originalPrice.toLocaleString()}
                                    </span>
                                    <span style={{
                                        color: PRIMARY_COLOR,
                                        fontSize: '16px',
                                        fontWeight: '800'
                                    }}>
                                        UGX {currentPrice.toLocaleString()}
                                    </span>
                                </>
                            ) : (
                                <span style={{
                                    color: PRIMARY_COLOR,
                                    fontSize: '16px',
                                    fontWeight: '800'
                                }}>
                                    UGX {currentPrice.toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
