import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import * as XLSX from 'xlsx';
import { FaArrowLeft } from 'react-icons/fa';

// Components
import PromotionalVideoFeed from './components/PromotionalVideoFeed.jsx';
import Header from './components/Header.jsx';
import CategorySection from './components/CategorySection.jsx';
import CartSummary from './components/CartSummary.jsx';
import EmptyState from './components/EmptyState.jsx';

// Lazy-loaded modal components for code splitting
const ProductDetailsModal = lazy(() => import('./components/ProductDetailsModal.jsx'));
const CustomerInfoModal = lazy(() => import('./components/CustomerInfoModal.jsx'));
const OrderHistoryModal = lazy(() => import('./components/OrderHistoryModal.jsx'));
const OrderPreview = lazy(() => import('./components/OrderPreview.jsx'));
const SmallCatalogView = lazy(() => import('./components/SmallCatalogView.jsx'));

// Constants
import { BACKGROUND_COLOR } from './constants/colors';

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

function App() {
    // Product state
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const cartRef = useRef(null);
    const headerRef = useRef(null);
    const [headerHeight, setHeaderHeight] = useState(120);

    // Search States
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [showOrderPreview, setShowOrderPreview] = useState(false);
    const [showSmallCatalog, setShowSmallCatalog] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [showOrderHistory, setShowOrderHistory] = useState(false);

    // Customer and Order States
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', location: '', address: '' });
    const [orderHistory, setOrderHistory] = useState([]);
    const [isSendingOrder, setIsSendingOrder] = useState(false);
    const [orderStatus, setOrderStatus] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const EXCEL_URL = 'https://docs.google.com/spreadsheets/d/1Kz-kNPTNl1Loqrwj3B1iuIL5fZRUkFHL/export?format=xlsx';
        loadExcelFromUrl(EXCEL_URL);

        const savedCustomer = localStorage.getItem('customerInfo');
        const savedOrders = localStorage.getItem('orderHistory');
        if (savedCustomer) setCustomerInfo(JSON.parse(savedCustomer));
        if (savedOrders) setOrderHistory(JSON.parse(savedOrders));
    }, []);

    // Handle category change: Always scroll to top
    useEffect(() => {
        if (selectedCategory) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [selectedCategory]);

    // Preload critical images
    useEffect(() => {
        if (products.length > 0) {
            import('./utils/imageLoader.js').then((module) => {
                module.preloadCriticalImages(products, 20).catch(() => {});
                const promoProducts = products.filter(p => p.promotion === true);
                if (promoProducts.length > 0) {
                    module.preloadCriticalImages(promoProducts, promoProducts.length).catch(() => {});
                }
            });
        }
    }, [products]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (!isScrolled && currentScrollY > 100) setIsScrolled(true);
            else if (isScrolled && currentScrollY < 40) setIsScrolled(false);
        };
        const throttledHandleScroll = throttle(handleScroll, 10);
        window.addEventListener('scroll', throttledHandleScroll);
        return () => window.removeEventListener('scroll', throttledHandleScroll);
    }, [isScrolled]);

    const loadExcelFromUrl = async (url) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const validProducts = jsonData.map((row, index) => ({
                id: Number(row.id || row.ID || index + 1),
                name: String(row.name || row.Name || '').trim(),
                brand: String(row.brand || row.Brand || '').trim(),
                category: String(row.category || row.Category || 'other').trim(),
                description: String(row.description || row.Description || '').trim(),
                image: String(row.image || row.Image || '').trim().replace(/\\s/g, '') || '',
                stock: String(row.stock || row.Stock || 'In Stock').trim(),
                promotion: String(row.promotion || '').toLowerCase() === 'true',
                promoCommunicator: String(row.promoCommunicator || '').trim()
            })).filter(p => p.category.toLowerCase() !== 'other' && p.name !== '');

            setProducts(validProducts);
            setLoading(false);
        } catch (err) {
            console.error('Error loading Excel', err);
            setError('Could not load catalog data.');
            setLoading(false);
        }
    };

    const updateQuantity = (productId, changeOrValue) => {
        setCart(prev => {
            const current = prev[productId];
            let newValue;

            if (typeof changeOrValue === 'string') {
                // Direct value update
                newValue = changeOrValue;
            } else {
                // Numeric change
                const currentNum = parseInt(current) || 0;
                newValue = Math.max(0, currentNum + changeOrValue);
            }

            const newCart = { ...prev, [productId]: newValue };
            
            // Remove ONLY if value is exactly 0
            if (newValue === 0) {
                const { [productId]: _, ...rest } = newCart;
                return rest;
            }
            return newCart;
        });
    };

    const getTotalItems = () => Object.keys(cart).length;

    useEffect(() => {
        const updateHeights = () => {
            if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
        };
        updateHeights();
        window.addEventListener('resize', updateHeights);
        window.addEventListener('scroll', updateHeights);
        return () => {
            window.removeEventListener('resize', updateHeights);
            window.removeEventListener('scroll', updateHeights);
        };
    }, [isScrolled]);

    const getFilteredProducts = () => {
        const q = searchQuery.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.brand.toLowerCase().includes(q) || 
            p.category.toLowerCase().includes(q)
        );
    };

    const categories = [...new Set(getFilteredProducts().map(p => p.category))]
        .filter(c => c && c.toLowerCase() !== 'other' && c.trim() !== '');

    const getProductsByCategory = (category) => getFilteredProducts().filter(p => p.category === category);

    const handleWhatsAppOrder = () => {
        setShowCustomerForm(true);
    };

    const proceedWithOrder = async () => {
        const orderItems = Object.entries(cart)
            .filter(([_, qty]) => qty > 0)
            .map(([productId, qty]) => {
                const product = products.find(p => p.id === parseInt(productId));
                return { name: product?.name || 'Unknown', qty };
            });

        if (orderItems.length === 0) return;

        setIsSendingOrder(true);

        let message = `*New Order from Kookee Cart*\n`;
        message += `-------------------------\n`;
        message += `*Customer:* ${customerInfo.name}\n`;
        message += `*Phone:* ${customerInfo.phone}\n`;
        if (customerInfo.location) message += `*Location:* ${customerInfo.location}\n`;
        if (customerInfo.address) message += `*Address:* ${customerInfo.address}\n\n`;
        
        message += `*Items:*\n`;
        orderItems.forEach(item => {
            message += `- ${item.name} (Qty: ${item.qty})\n`;
        });
        message += `-------------------------`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/256759141177?text=${encodedMessage}`;

        try {
            await fetch("https://cap-ottawa-promptly-santa.trycloudflare.com/send-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order: {
                        customerName: customerInfo.name,
                        customerPhone: customerInfo.phone,
                        items: orderItems,
                        location: customerInfo.location,
                        address: customerInfo.address
                    },
                    recipient: "256759141177@c.us"
                })
            });
        } catch (err) {
            console.error("Backend log failed.");
        }

        setOrderStatus('success');
        localStorage.setItem('customerInfo', JSON.stringify(customerInfo));
        
        setTimeout(() => {
            window.open(whatsappUrl, '_blank');
            setCart({});
            setShowCustomerForm(false);
            setIsSendingOrder(false);
            setOrderStatus(null);
        }, 1500);
    };

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h2>Loading Kookee Catalog...</h2></div>;

    return (
        <div style={{ minHeight: '100vh', background: BACKGROUND_COLOR, paddingBottom: getTotalItems() > 0 ? '100px' : '20px' }}>
            {getTotalItems() > 0 && (
                <CartSummary
                    ref={cartRef}
                    totalItems={getTotalItems()}
                    onOrderClick={handleWhatsAppOrder}
                    onPreviewClick={() => setShowOrderPreview(true)}
                />
            )}

            <div ref={headerRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
                <Header 
                    isScrolled={isScrolled} 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery}
                    onShowOrderHistory={() => setShowOrderHistory(true)}
                    orderHistoryCount={orderHistory.length}
                />
            </div>

            <div style={{ height: `${headerHeight}px` }} />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 15px' }}>
                {!searchQuery && !selectedCategory && <PromotionalVideoFeed products={products.filter(p => p.promotion).slice(0, 5)} onProductClick={p => setSelectedProduct(p)} />}

                {getFilteredProducts().length === 0 ? <EmptyState onClearFilters={() => setSearchQuery('')} /> : (
                    <div style={{ marginTop: '16px' }}>
                        {selectedCategory ? (
                            <>
                                <button 
                                    onClick={() => setSelectedCategory(null)} 
                                    style={{ 
                                        background: '#f1f5f9', 
                                        border: 'none', 
                                        color: '#C85A32', 
                                        cursor: 'pointer', 
                                        padding: '10px 16px',
                                        borderRadius: '12px',
                                        fontWeight: '700',
                                        marginBottom: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <FaArrowLeft size={14} /> Back to Catalog
                                </button>
                                <CategorySection key={selectedCategory} categoryName={selectedCategory} products={getProductsByCategory(selectedCategory)} cart={cart} updateQuantity={updateQuantity} onProductClick={p => setSelectedProduct(p)} showAll={true} />
                            </>
                        ) : (
                            <div id="categories-anchor" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                                {categories.map(category => <CategorySection key={category} categoryName={category} products={getProductsByCategory(category)} cart={cart} updateQuantity={updateQuantity} onProductClick={p => setSelectedProduct(p)} onViewAll={c => setSelectedCategory(c)} />)}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Suspense fallback={null}>
                <OrderPreview show={showOrderPreview} cart={cart} products={products} updateQuantity={updateQuantity} onClose={() => setShowOrderPreview(false)} onProceed={() => { setShowOrderPreview(false); handleWhatsAppOrder(); }} />
                <SmallCatalogView show={showSmallCatalog} products={products} cart={cart} updateQuantity={updateQuantity} onClose={() => setShowSmallCatalog(false)} />
                {selectedProduct && <ProductDetailsModal product={selectedProduct} cart={cart} updateQuantity={updateQuantity} onClose={() => setSelectedProduct(null)} />}
                <CustomerInfoModal show={showCustomerForm} customerInfo={customerInfo} setCustomerInfo={setCustomerInfo} onCancel={() => setShowCustomerForm(false)} onSubmit={proceedWithOrder} isSending={isSendingOrder} orderStatus={orderStatus} />
                <OrderHistoryModal show={showOrderHistory} orderHistory={orderHistory} onClose={() => setShowOrderHistory(false)} />
            </Suspense>

            {/* Quick Access Fab */}
            <button 
                onClick={() => setShowSmallCatalog(true)} 
                style={{ 
                    position: 'fixed', 
                    right: 20, 
                    bottom: getTotalItems() > 0 ? '110px' : 24, 
                    zIndex: 900, 
                    background: '#C85A32', 
                    color: 'white', 
                    border: 'none', 
                    width: '56px',
                    height: '56px',
                    borderRadius: '18px', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(200, 90, 50, 0.4)',
                    cursor: 'pointer'
                }}
            >
                <span style={{ fontSize: '24px' }}>📑</span>
            </button>
        </div>
    );
}

export default App;