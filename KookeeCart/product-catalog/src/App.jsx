import React, { useState, useEffect, useRef } from "react";
import * as XLSX from 'xlsx';
import { FaArrowLeft, FaSync } from 'react-icons/fa';

// Components
import PromotionalVideoFeed from './components/PromotionalVideoFeed.jsx';
import Header from './components/Header.jsx';
import MenuTabs from './components/MenuTabs.jsx';
import CategorySection from './components/CategorySection.jsx';
import ProductDetailsModal from './components/ProductDetailsModal.jsx';
import CustomerInfoModal from './components/CustomerInfoModal.jsx';
import OrderHistoryModal from './components/OrderHistoryModal.jsx';
import CartSummary from './components/CartSummary.jsx';
import EmptyState from './components/EmptyState.jsx';
import OrderPreview from './components/OrderPreview.jsx';
import SmallCatalogView from './components/SmallCatalogView.jsx';

// Constants
import { PRIMARY_COLOR, ACCENT_COLOR, DANGER_COLOR, BACKGROUND_COLOR, CARD_BACKGROUND, TEXT_COLOR, LIGHT_TEXT_COLOR } from './constants/colors';

// --- Utility Function: Scroll Throttling ---
const throttle = (func, limit) => {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}
// --------------------------------------------------------

function App() {
    // Product state
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const cartRef = useRef(null);
    const [cartHeight, setCartHeight] = useState(0);
    const headerRef = useRef(null);
    const [headerHeight, setHeaderHeight] = useState(100);
    const tabsRef = useRef(null);
    const [tabsHeight, setTabsHeight] = useState(60);

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
    const [showFilters, setShowFilters] = useState(false);

    // Modal States
    const [showOrderPreview, setShowOrderPreview] = useState(false);
    const [showSmallCatalog, setShowSmallCatalog] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [showOrderHistory, setShowOrderHistory] = useState(false);

    // Customer and Order States
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
    const [orderHistory, setOrderHistory] = useState([]);
    const [isSendingOrder, setIsSendingOrder] = useState(false);
    const [orderStatus, setOrderStatus] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState(new Set());

    useEffect(() => {
        const EXCEL_URL = 'https://docs.google.com/spreadsheets/d/1Kz-kNPTNl1Loqrwj3B1iuIL5fZRUkFHL/export?format=xlsx';
        loadExcelFromUrl(EXCEL_URL);

        const savedCustomer = localStorage.getItem('customerInfo');
        const savedOrders = localStorage.getItem('orderHistory');
        if (savedCustomer) setCustomerInfo(JSON.parse(savedCustomer));
        if (savedOrders) setOrderHistory(JSON.parse(savedOrders));
    }, []);

    // Preload critical images after products load
    useEffect(() => {
        if (products.length > 0) {
            // Dynamically import to avoid blocking initial render
            import('./utils/imageLoader.js').then((module) => {
                // Preload first 20 product images (increased from 8 for faster display)
                module.preloadCriticalImages(products, 20).catch(() => {
                    // Silently fail - images will load normally
                });

                // Also preload promotional product images immediately
                const promoProducts = products.filter(p => p.promotion === true);
                if (promoProducts.length > 0) {
                    module.preloadCriticalImages(promoProducts, promoProducts.length).catch(() => {
                        // Silently fail
                    });
                }
            });
        }
    }, [products]);

    // --- MODIFIED SCROLL EFFECT (THE FIX) ---
    useEffect(() => {
        // New: Define two different thresholds
        const SHRINK_THRESHOLD = 150;
        const GROW_THRESHOLD = 50;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            let newState = isScrolled;

            // Logic to determine the new state using two thresholds
            if (!isScrolled && currentScrollY > SHRINK_THRESHOLD) {
                // Shrink: Only shrink if you pass the higher threshold
                newState = true;
            } else if (isScrolled && currentScrollY < GROW_THRESHOLD) {
                // Grow: Only grow if you pass the lower threshold
                newState = false;
            }

            // Only update state if it actually changed
            if (newState !== isScrolled) {
                setIsScrolled(newState);
            }
        };

        // Maintain 5ms throttling (very fast, practically unthrottled, but keeps the throttle function)
        const throttledHandleScroll = throttle(handleScroll, 5);

        window.addEventListener('scroll', throttledHandleScroll);

        return () => window.removeEventListener('scroll', throttledHandleScroll);
        // Note: We include isScrolled as a dependency because the logic reads its current value
    }, [isScrolled]);
    // -----------------------------------------

    const loadExcelFromUrl = async (url) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            console.log("Excel Row Sample Keys:", jsonData.length > 0 ? Object.keys(jsonData[0]) : "Empty Sheet");

            const validProducts = jsonData.map((row, index) => {
                const productId = row.id || row.ID || row.Id || (index + 1);
                const rawPrice = Math.round(parseFloat(String(row.price || row.Price || row.PRICE || '0').replace(/[^0-9.]/g, '')) || 0);
                const rawCutPrice = Math.round(parseFloat(String(row.cutprice || row.Cutprice || row.CUTPRICE || row.cutPrice || '0').replace(/[^0-9.]/g, '')) || 0);

                // Logic as per User: cutPrice column IS the cut price (Now). price column is Real Price (Was).
                let price = rawPrice;
                let wasPrice = 0;

                if (rawCutPrice > 0 && rawCutPrice < rawPrice) {
                    price = rawCutPrice;
                    wasPrice = rawPrice;
                }

                // Parsing promotion (check for truthy strings)
                const promoVal = String(row.promotion || row.Promotion || row.PROMOTION || 'false').toLowerCase();
                const isPromotion = promoVal === 'true' || promoVal === 'yes' || promoVal === '1';

                return {
                    id: Number(productId),
                    name: String(row.name || row.Name || row.NAME || '').trim(),
                    brand: String(row.brand || row.Brand || row.BRAND || '').trim(),
                    category: String(row.category || row.Category || row.CATEGORY || 'other').trim(),
                    price: price,
                    cutPrice: wasPrice,
                    description: String(row.description || row.Description || row.DESCRIPTION || '').trim(),
                    image: String(row.image || row.Image || row.IMAGE || '').trim().replace(/\\s/g, '') || '',
                    imageAlt: row.imageAlt || row.ImageAlt || '',
                    stock: String(row.stock || row.Stock || row.STOCK || 'In Stock').trim(),
                    promotion: isPromotion,
                    promoCommunicator: String(row.promoCommunicator || row.PromoCommunicator || row.PROMOCOMMUNICATOR || '').trim()
                };
            }).filter(p => p.category.toLowerCase() !== 'other' && p.name !== '');

            setProducts(validProducts);

            const prices = validProducts.length ? validProducts.map(p => p.price) : [0, 0];
            setPriceRange({ min: Math.min(...prices), max: Math.max(...prices) });

            setLoading(false);
        } catch (err) {
            console.error('Error loading Excel', err);
            setError('Could not load catalog data. Please check the Excel URL.');
            setLoading(false);
        }
    };

    const updateQuantity = (productId, change) => {
        setCart(prev => {
            const newCart = {
                ...prev,
                [productId]: Math.max(0, (prev[productId] || 0) + change)
            };
            if (newCart[productId] === 0) {
                const { [productId]: _, ...rest } = newCart;
                return rest;
            }
            return newCart;
        });
    };

    const getTotalItems = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    const getTotalPrice = () => {
        return Object.entries(cart).reduce((sum, [productId, qty]) => {
            const product = products.find(p => p.id === parseInt(productId));
            return sum + (product ? product.price * qty : 0);
        }, 0);
    };

    useEffect(() => {
        if (cartRef.current) {
            setCartHeight(cartRef.current.offsetHeight);
        }
    }, [cart, cartRef.current]);

    // Measure header and tabs height for fixed positioning
    useEffect(() => {
        const updateHeights = () => {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.offsetHeight);
            }
            if (tabsRef.current) {
                setTabsHeight(tabsRef.current.offsetHeight);
            }
        };
        // Update immediately and on scroll/resize
        updateHeights();
        window.addEventListener('resize', updateHeights);
        window.addEventListener('scroll', updateHeights);
        // Use a small delay to catch size changes after scroll
        const timeoutId = setTimeout(updateHeights, 100);
        return () => {
            window.removeEventListener('resize', updateHeights);
            window.removeEventListener('scroll', updateHeights);
            clearTimeout(timeoutId);
        };
    }, [isScrolled]);

    const getFilteredProducts = () => {
        const q = searchQuery.toLowerCase();
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(q) ||
                p.brand.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q);
            const matchesPrice = p.price >= (priceRange.min || 0) && p.price <= (priceRange.max ?? Infinity);
            return matchesSearch && matchesPrice;
        });
    };

    const categories = [...new Set(getFilteredProducts().map(p => p.category))]
        .filter(c => c && c.toLowerCase() !== 'other' && c.trim() !== '');

    const getProductsByCategory = (category) => getFilteredProducts().filter(p => p.category === category);

    const getPromotionalProducts = () => {
        const promos = products.filter(p => p.promotion === true);
        // Fallback: If no explicit promotions, show the first 5 products so the slider is visible
        if (promos.length === 0 && products.length > 0) {
            return products.slice(0, 5);
        }
        return promos;
    };

    const handleQuickAdd = (productId) => {
        updateQuantity(productId, 1);
    };

    const handleWhatsAppOrder = () => {
        const totalPrice = getTotalPrice();
        if (totalPrice < 200000) {
            alert(`❌ Minimum Order: UGX 200,000\n\nYour current total: UGX ${totalPrice.toLocaleString()}\n\nPlease add UGX ${(200000 - totalPrice).toLocaleString()} more to proceed.`);
            return;
        }
        setShowCustomerForm(true);
    };

    const handleSyncImages = async () => {
        if (!window.confirm("Sync all product images to backend? This will clear the image cache and re-download all images.")) return;

        setIsSyncing(true);
        try {
            // Clear service worker cache first
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                const messageChannel = new MessageChannel();

                // Send message to service worker to clear cache
                navigator.serviceWorker.controller.postMessage(
                    { type: 'CLEAR_CACHE' },
                    [messageChannel.port2]
                );

                // Wait for cache clearing confirmation
                await new Promise((resolve) => {
                    messageChannel.port1.onmessage = (event) => {
                        if (event.data.success) {
                            console.log('✅ Cache cleared successfully');
                            resolve();
                        }
                    };
                    // Timeout after 2 seconds
                    setTimeout(resolve, 2000);
                });
            }

            // Now sync images with backend
            const res = await fetch("http://localhost:5000/sync-images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products })
            });
            if (res.ok) {
                alert("✅ Sync Complete! Cache cleared and images refreshed.");
                // Reload page to fetch fresh images
                window.location.reload();
            } else {
                alert("❌ Sync Failed");
            }
        } catch (err) {
            console.error("Sync Error", err);
            alert("❌ Error connecting to backend");
        } finally {
            setIsSyncing(false);
        }
    };

    const proceedWithOrder = async () => {
        const orderItems = Object.entries(cart)
            .filter(([_, qty]) => qty > 0)
            .map(([productId, qty]) => {
                const product = products.find(p => p.id === parseInt(productId));
                return {
                    name: product?.name || 'Unknown',
                    qty,
                    price: product?.price || 0,
                    image: product?.image || null
                };
            });

        if (orderItems.length === 0) {
            alert('Your cart is empty');
            return;
        }

        const orderDate = new Date().toLocaleString();
        const orderDetails = {
            date: orderDate,
            customer: customerInfo,
            items: orderItems,
            total: getTotalPrice()
        };

        setIsSendingOrder(true);
        setOrderStatus(null);

        try {
            const res = await fetch("https://cap-ottawa-promptly-santa.trycloudflare.com/send-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order: {
                        customerName: customerInfo.name,
                        customerPhone: customerInfo.phone,
                        total: getTotalPrice(),
                        items: orderItems
                    },
                    recipient: "256782226038@c.us"
                })
            });

            const data = await res.json().catch(() => ({}));

            if (data.success || res.ok) {
                setOrderStatus('success');
                const newHistory = [...orderHistory, orderDetails];
                setOrderHistory(newHistory);
                localStorage.setItem('orderHistory', JSON.stringify(newHistory));

                setTimeout(() => {
                    setCart({});
                    setShowCustomerForm(false);
                    setIsSendingOrder(false);
                    setOrderStatus(null);
                }, 2500);
            } else {
                setOrderStatus('error');
                setTimeout(() => {
                    setIsSendingOrder(false);
                    setOrderStatus(null);
                }, 3000);
            }
        } catch (err) {
            console.error("❌ Error sending order:", err);
            setOrderStatus('error');
            setTimeout(() => {
                setIsSendingOrder(false);
                setOrderStatus(null);
            }, 3000);
        }
    };

    if (loading) {
        return (
            <div style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${BACKGROUND_COLOR} 0%, #dee2e6 100%)`
            }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <h2 style={{ color: PRIMARY_COLOR }}>Loading Products...</h2>
                <p style={{ color: LIGHT_TEXT_COLOR }}>Please wait</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: `linear-gradient(135deg, ${BACKGROUND_COLOR} 0%, #dee2e6 100%)`
            }}>
                <div style={{
                    textAlign: 'center',
                    backgroundColor: CARD_BACKGROUND,
                    padding: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                    maxWidth: '500px'
                }}>
                    <div style={{ fontSize: '40px', marginBottom: '15px', color: DANGER_COLOR }}>⚠️</div>
                    <h2 style={{ color: DANGER_COLOR, marginBottom: '10px' }}>Error Loading Products</h2>
                    <p style={{ color: TEXT_COLOR, marginBottom: '25px' }}>{error}</p>
                    <button
                        style={{
                            backgroundColor: PRIMARY_COLOR,
                            color: 'white',
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '30px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Main render
    return (
        <div style={{
            minHeight: '100vh',
            background: `radial-gradient(circle at 50% 30%, #ffffff 0%, ${BACKGROUND_COLOR} 100%)`,
            paddingBottom: getTotalItems() > 0 ? '90px' : '20px',
            transition: 'background 0.5s ease',
            overflowX: 'hidden', // Prevent horizontal overflow
            // Don't set overflow on parent - let body/html be the scrolling container
        }}>

            {/* Cart Summary (Fixed Bottom) */}
            {getTotalItems() > 0 && (
                <CartSummary
                    ref={cartRef}
                    totalItems={getTotalItems()}
                    totalPrice={getTotalPrice()}
                    onOrderClick={handleWhatsAppOrder}
                    onPreviewClick={() => setShowOrderPreview(true)}
                    cartRef={cartRef}
                />
            )}

            {/* Floating Catalog Button - Higher z-index to be above cart */}
            <button
                onClick={() => setShowSmallCatalog(true)}
                style={{
                    position: 'fixed',
                    right: 18,
                    bottom: getTotalItems() > 0 ? '100px' : 20, // Adjust position when cart is visible
                    zIndex: 1100, // Above cart overlay (1000)
                    background: PRIMARY_COLOR,
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: 999,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: '44px', // Touch target optimization
                    minWidth: '44px', // Touch target optimization
                    transition: 'bottom 0.3s ease'
                }}
            >
                📑 Quick Catalog
            </button>

            {/* Fixed Header Section - Shrinks on scroll */}
            <div
                ref={headerRef}
                className="glass"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    transition: 'all 0.3s ease',
                    boxShadow: isScrolled ? '0 3px 8px rgba(0,0,0,0.05)' : 'none',
                    width: '100%'
                }}
            >
                <Header
                    isScrolled={isScrolled}
                    filteredProductsCount={getFilteredProducts().length}
                    totalProductsCount={products.length}
                    searchQuery={searchQuery}
                    onSync={handleSyncImages}
                    isSyncing={isSyncing}
                />
            </div>

            {/* Fixed Menu Tabs - Below header */}
            <div
                ref={tabsRef}
                className="glass"
                style={{
                    position: 'fixed',
                    top: `${headerHeight}px`, // Use measured header height
                    left: 0,
                    right: 0,
                    zIndex: 999,
                    width: '100%',
                    transition: 'top 0.3s ease'
                }}
            >
                <MenuTabs
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    orderHistory={orderHistory}
                    onShowOrderHistory={() => setShowOrderHistory(true)}
                    isScrolled={isScrolled}
                />
            </div>

            {/* Spacer to prevent content from going under fixed header/tabs */}
            <div style={{
                height: `${headerHeight + tabsHeight}px`, // Header height + tabs height
                transition: 'height 0.3s ease',
                width: '100%'
            }} />

            {/* Main Content Area */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 15px' }}>

                {/* Promotional Video Feed (Ad Style) - Static at top */}
                {!searchQuery && !selectedCategory && (
                    <PromotionalVideoFeed
                        products={getPromotionalProducts()}
                        onProductClick={p => setSelectedProduct(p)}
                    />
                )}

                {getFilteredProducts().length === 0 ? (
                    <EmptyState onClearFilters={() => {
                        setSearchQuery('');
                        const prices = products.map(p => p.price);
                        setPriceRange({ min: Math.min(...prices), max: Math.max(...prices) });
                    }} />
                ) : (
                    <div>
                        {selectedCategory ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
                                    <button onClick={() => setSelectedCategory(null)} style={{ background: 'none', border: 'none', color: PRIMARY_COLOR, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FaArrowLeft /> Back to all categories
                                    </button>
                                    <h2 style={{ margin: 0 }}>{selectedCategory}</h2>
                                </div>

                                <CategorySection
                                    key={selectedCategory}
                                    categoryName={selectedCategory}
                                    products={getProductsByCategory(selectedCategory)}
                                    cart={cart}
                                    updateQuantity={updateQuantity}
                                    onProductClick={p => setSelectedProduct(p)}
                                    onViewAll={(category) => {
                                        setExpandedCategories(prev => new Set([...prev, category]));
                                    }}
                                    showAll={true}
                                    maxProducts={expandedCategories.has(selectedCategory) ? 0 : 12}
                                />
                            </>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gap: '20px',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                padding: '0 0 20px 0'
                            }}>
                                {categories.map(category => (
                                    <CategorySection
                                        key={category}
                                        categoryName={category}
                                        products={getProductsByCategory(category)}
                                        cart={cart} // These cart/update props are ignored by the new CategorySection, but kept for type consistency
                                        updateQuantity={updateQuantity}
                                        onProductClick={p => setSelectedProduct(p)}
                                        onViewAll={c => setSelectedCategory(c)}
                                        previewCount={4} // Ignored by the new single-card CategorySection
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <OrderPreview
                show={showOrderPreview}
                cart={cart}
                products={products}
                updateQuantity={updateQuantity}
                onClose={() => setShowOrderPreview(false)}
                onProceed={() => {
                    setShowOrderPreview(false);
                    handleWhatsAppOrder();
                }}
            />

            <SmallCatalogView
                show={showSmallCatalog}
                products={products}
                cart={cart}
                updateQuantity={updateQuantity}
                onClose={() => setShowSmallCatalog(false)}
            />

            {selectedProduct && (
                <ProductDetailsModal
                    product={selectedProduct}
                    cart={cart}
                    updateQuantity={updateQuantity}
                    onClose={() => setSelectedProduct(null)}
                />
            )}

            <CustomerInfoModal
                show={showCustomerForm}
                customerInfo={customerInfo}
                setCustomerInfo={setCustomerInfo}
                onCancel={() => setShowCustomerForm(false)}
                onSubmit={() => {
                    if (customerInfo.name.trim() && customerInfo.phone.trim()) {
                        localStorage.setItem('customerInfo', JSON.stringify(customerInfo));
                        proceedWithOrder();
                    } else {
                        alert('Please fill in all fields');
                    }
                }}
                isSending={isSendingOrder}
                orderStatus={orderStatus}
            />

            <OrderHistoryModal
                show={showOrderHistory}
                orderHistory={orderHistory}
                onClose={() => setShowOrderHistory(false)}
            />

            {/* Hidden admin utility - Sync Images */}
            <div style={{ textAlign: 'center', padding: '40px 20px', marginTop: '40px' }}>
                <button
                    onClick={handleSyncImages}
                    disabled={isSyncing}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: LIGHT_TEXT_COLOR,
                        fontSize: '12px',
                        cursor: isSyncing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        margin: '0 auto',
                        opacity: 0.6
                    }}
                >
                    <span className={isSyncing ? 'fa-spin' : ''}>🔄</span>
                    Sync Catalog Images
                </button>
            </div>
        </div>
    );
}

export default App;