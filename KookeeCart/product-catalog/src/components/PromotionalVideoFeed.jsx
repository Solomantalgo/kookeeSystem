import React, { useState, useEffect } from 'react';
import { PRIMARY_COLOR, ACCENT_COLOR, TEXT_COLOR } from '../constants/colors';

// Simple "Video Ad" style feed
// - Auto plays (loops)
// - Shows one product at a time
// - Large image + "Special Offer" badge
// - "Cut Price" logic
export default function PromotionalVideoFeed({ products = [], onProductClick }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState(new Set());
    const [loadedImages, setLoadedImages] = useState(new Set());

    // Preload all promotional images immediately
    useEffect(() => {
        products.forEach(product => {
            const cleanName = product.name ? product.name.replace(/[^a-zA-Z0-9]/g, '') : 'product';
            const webpSrc = `/images/${cleanName}.webp`;
            const jpgSrc = `/images/${cleanName}.jpg`;
            
            // Try WebP first
            const img = new Image();
            img.onload = () => setLoadedImages(prev => new Set([...prev, product.id]));
            img.onerror = () => {
                // Fallback to JPG
                const fallbackImg = new Image();
                fallbackImg.onload = () => setLoadedImages(prev => new Set([...prev, product.id]));
                fallbackImg.src = jpgSrc;
            };
            img.src = webpSrc;
        });
    }, [products]);

    // Auto-play logic - increased to 6 seconds for better loading
    useEffect(() => {
        if (products.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % products.length);
        }, 6000); // Increased from 4 to 6 seconds

        return () => clearInterval(interval);
    }, [products.length]);

    // Preload images for promotional products
    useEffect(() => {
        products.forEach(product => {
            const cleanName = product.name ? product.name.replace(/[^a-zA-Z0-9]/g, '') : 'product';
            const img = new Image();
            img.src = `/images/${cleanName}.jpg`;
        });
    }, [products]);

    if (!products.length) return null;

    const product = products[currentIndex];
    
    // Ensure numeric values for price comparisons
    const currentPrice = Number(product.price) || 0;
    const originalPrice = Number(product.cutPrice) || 0;
    const hasDiscount = originalPrice > 0 && originalPrice > currentPrice;
    const promoText = product.promoCommunicator ? String(product.promoCommunicator).trim() : '';
    const hasPromoText = promoText !== '' && promoText !== 'false' && promoText !== 'null';

    // Image fallback logic handling (preserve case to match actual filenames)
    const cleanName = product.name ? product.name.replace(/[^a-zA-Z0-9]/g, '') : 'product';
    const localImage = `/images/${cleanName}.jpg`;
    const hasImageError = imageErrors.has(product.id);

    const handleImageError = (e) => {
        // Mark this product's image as failed, but don't hide - show placeholder instead
        setImageErrors(prev => new Set([...prev, product.id]));
    };

    const handleImageLoad = () => {
        // Remove from error set if it loads successfully
        setImageErrors(prev => {
            const newSet = new Set(prev);
            newSet.delete(product.id);
            return newSet;
        });
    };

    return (
        <div style={{
            width: '100%',
            backgroundColor: '#000', // Video feel
            position: 'relative', // Relative for absolute children positioning
            overflow: 'hidden',
            marginBottom: '20px',
            borderRadius: '0 0 24px 24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            aspectRatio: '16/9', // Fixed aspect ratio - no shrinking
            cursor: 'pointer'
        }} onClick={() => onProductClick(product)}>

            {/* Background / Image Area */}
            <div style={{ 
                width: '100%', 
                height: '100%', 
                backgroundColor: '#000', 
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {!loadedImages.has(product.id) ? (
                    // Loading state
                    <div style={{
                        color: 'white',
                        fontSize: '18px',
                        textAlign: 'center',
                        opacity: 0.7
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid rgba(255,255,255,0.3)',
                            borderTop: '3px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 10px'
                        }} />
                        Loading...
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                ) : hasImageError ? (
                    // Placeholder when image fails
                    <div style={{
                        color: 'white',
                        fontSize: '24px',
                        textAlign: 'center',
                        opacity: 0.7
                    }}>
                        {product.name}
                    </div>
                ) : (
                    <img
                        key={product.id} // Force re-render when product changes
                        src={localImage}
                        alt={product.name}
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        loading="eager" // Load immediately for promotional feed
                        decoding="async"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain', // Change to contain for professional fitted look
                            opacity: 0.9,
                            transition: 'opacity 0.3s ease'
                        }}
                    />
                )}
            </div>

            {/* Overlay Content - Must be above image */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 10, // Above the image
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                padding: '24px',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                pointerEvents: 'auto' // Ensure clicks work
            }}>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                        backgroundColor: ACCENT_COLOR,
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '11px',
                        padding: '5px 12px',
                        borderRadius: '50px', // Pill badge
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Exclusive Deal
                    </span>
                    {/* Show cut price badge if discount exists */}
                    {hasDiscount && (
                        <span style={{
                            backgroundColor: '#ef4444', // Consistent Red
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '11px',
                            padding: '5px 12px',
                            borderRadius: '50px',
                            letterSpacing: '0.5px'
                        }}>
                            SAVE {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%
                        </span>
                    )}
                    {/* Display promoCommunicator if present */}
                    {hasPromoText && (
                        <span style={{
                            backgroundColor: PRIMARY_COLOR,
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '11px',
                            padding: '5px 12px',
                            borderRadius: '50px',
                            letterSpacing: '0.5px'
                        }}>
                            {promoText}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h2 style={{
                    margin: '0 0 6px 0',
                    fontSize: '22px', // Fixed font size - no shrinking
                    fontWeight: '700',
                    letterSpacing: '-0.5px',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}>
                    {product.name}
                </h2>

                {/* Price Logic - Show cut price if available */}
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    {hasDiscount ? (
                        <>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'rgba(255,255,255,0.1)',
                                padding: '4px 12px',
                                borderRadius: '8px',
                                borderLeft: '3px solid #ccc'
                            }}>
                                <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Was</span>
                                <span style={{
                                    textDecoration: 'line-through',
                                    opacity: 0.7,
                                    fontSize: '15px',
                                    fontWeight: '500'
                                }}>
                                    UGX {originalPrice.toLocaleString()}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'rgba(212, 112, 74, 0.2)', // Terracotta tint
                                padding: '4px 12px',
                                borderRadius: '8px',
                                borderLeft: `3px solid ${PRIMARY_COLOR}`
                            }}>
                                <span style={{ fontSize: '10px', color: PRIMARY_COLOR, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Now</span>
                                <span style={{ color: PRIMARY_COLOR, fontSize: '24px', fontWeight: '900' }}>
                                    UGX {currentPrice.toLocaleString()}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            background: `linear-gradient(45deg, ${PRIMARY_COLOR}, #B85A3A)`,
                            padding: '10px 20px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                        }}>
                            <span style={{ color: 'white', fontSize: '22px', fontWeight: '800' }}>UGX {currentPrice.toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress / Dots */}
            <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 15, // Above overlay content
                display: 'flex',
                gap: '4px'
            }}>
                {products.map((_, idx) => (
                    <div
                        key={idx}
                        style={{
                            width: currentIndex === idx ? '16px' : '4px',
                            height: '4px',
                            borderRadius: '2px',
                            backgroundColor: currentIndex === idx ? ACCENT_COLOR : 'rgba(255,255,255,0.5)',
                            transition: 'all 0.3s'
                        }}
                    />
                ))}
            </div>

        </div>
    );
}
