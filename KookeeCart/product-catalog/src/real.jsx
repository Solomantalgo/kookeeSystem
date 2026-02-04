import React, { useState, useEffect, useRef } from "react";
import * as XLSX from 'xlsx'
import { FaShoppingCart, FaWhatsapp, FaArrowLeft, FaUndo, FaSearch, FaTimes, FaFilter, FaInfoCircle } from 'react-icons/fa';

// --- Color Palette and Constants ---
const PRIMARY_COLOR = '#007bff';
const ACCENT_COLOR = '#28a745';
const DANGER_COLOR = '#dc3545';
const BACKGROUND_COLOR = '#f8f9fa';
const CARD_BACKGROUND = '#ffffff';
const TEXT_COLOR = '#343a40';
const LIGHT_TEXT_COLOR = '#6c757d';

function App () {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const cartRef = useRef(null);
const [cartHeight, setCartHeight] = useState(0);

  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 })
  const [showFilters, setShowFilters] = useState(false)
  
  // Product Details Modal
  const [selectedProduct, setSelectedProduct] = useState(null)
  
  // Customer Information
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' })
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  
  // Order History
  const [orderHistory, setOrderHistory] = useState([])
  const [showOrderHistory, setShowOrderHistory] = useState(false)
  
  // Order sending state
  const [isSendingOrder, setIsSendingOrder] = useState(false)
  const [orderStatus, setOrderStatus] = useState(null)
  // ✅ Scroll state
const [isScrolled, setIsScrolled] = useState(false);

// ✅ 1️⃣ Effect to load Excel + localStorage data
useEffect(() => {
  const EXCEL_URL = 'https://docs.google.com/spreadsheets/d/1Kz-kNPTNl1Loqrwj3B1iuIL5fZRUkFHL/export?format=xlsx';
  loadExcelFromUrl(EXCEL_URL);

  const savedCustomer = localStorage.getItem('customerInfo');
  const savedOrders = localStorage.getItem('orderHistory');
  if (savedCustomer) setCustomerInfo(JSON.parse(savedCustomer));
  if (savedOrders) setOrderHistory(JSON.parse(savedOrders));
}, []);

// ✅ 2️⃣ Separate effect for scroll listener
useEffect(() => {
  const handleScroll = () => setIsScrolled(window.scrollY > 100);
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);


  const loadExcelFromUrl = async(url) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log(`loading data from excel`)
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, {type:'array'})
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      console.log('Raw Excel data (first row):', jsonData[0])
      console.log('Available columns:', Object.keys(jsonData[0] || {}))

      const validProducts = jsonData.map((row, index) => {
        // Try to find the ID column (might be named differently)
        const productId = row.id || row.ID || row.Id || (index + 1)
        
        const product = {
          id: Number(productId),
          name: String(row.name || row.Name || row.NAME || '').trim(),
          brand: String(row.brand || row.Brand || row.BRAND || '').trim(),
          category: String(row.category || row.Category || row.CATEGORY || 'other').trim(),
          price: parseFloat(String(row.price || row.Price || row.PRICE || '0').replace(/[^0-9.]/g, '')),
          description: String(row.description || row.Description || row.DESCRIPTION || '').trim(),
          image: String(row.image || row.Image || row.IMAGE || '').trim().replace(/\s/g, ''),
          imageAlt: row.imageAlt || row.ImageAlt
        }
        console.log(`Product ${index + 1}:`, product)
        return product
      })

      console.log('Total products loaded:', validProducts.length)

      setProducts(validProducts)
      
      // Set price range based on actual products
      const prices = validProducts.map(p => p.price)
      setPriceRange({ min: Math.min(...prices), max: Math.max(...prices) })
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading Excel', err)
      setError('Could not load catalog data. Please check the Excel URL.')
      setLoading(false)
    }
  }

  const updateQuantity = (productId, change) => {
    console.log('Updating quantity for product ID:', productId, 'Change:', change)
    setCart(prev => {
      const newCart = {
        ...prev,
        [productId]: Math.max(0, (prev[productId] || 0) + change)
      }
      console.log('New cart:', newCart)
      return newCart
    })
  }

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  }

  const getTotalPrice = () => {
    const total = Object.entries(cart).reduce((sum, [productId, qty]) => {
      const product = products.find(p => p.id === parseInt(productId))
      console.log('Cart item:', productId, 'Qty:', qty, 'Product found:', product)
      return sum + (product ? product.price * qty : 0)
    }, 0)
    console.log('Total Price:', total)
    return total
  }

  // Update cart height whenever items change
useEffect(() => {
  if (cartRef.current) {
    setCartHeight(cartRef.current.offsetHeight);
  }
}, [getTotalItems()]);

  const getFilteredProducts = () => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPrice = p.price >= priceRange.min && p.price <= priceRange.max
      return matchesSearch && matchesPrice
    })
  }

  const categories = [...new Set(getFilteredProducts().map(p => p.category))]

  const getProductsByCategory = (category) => {
    return getFilteredProducts().filter(p => p.category === category)
  }

  const handleWhatsAppOrder = () => {
    // Check minimum order amount
    const totalPrice = getTotalPrice()
    
    console.log('Current cart total:', totalPrice) // Debug log
    
    if (totalPrice < 200000) {
      alert(`❌ Minimum Order: UGX 200,000\n\nYour current total: UGX ${totalPrice.toLocaleString()}\n\nPlease add UGX ${(200000 - totalPrice).toLocaleString()} more to proceed.`)
      return
    }
    
    // Show customer form if minimum met
    setShowCustomerForm(true)
  }

  const proceedWithOrder = async () => {
    const orderItems = Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, qty]) => {
        const product = products.find(p => p.id === parseInt(productId))
        return {
          name: product.name,
          qty,
          price: product.price,
          image: product.image || null
        }
      })

    if (orderItems.length === 0) {
      alert('Your cart is empty')
      return
    }

    const orderDate = new Date().toLocaleString()
    const orderDetails = {
      date: orderDate,
      customer: customerInfo,
      items: orderItems,
      total: getTotalPrice()
    }

    setIsSendingOrder(true)
    setOrderStatus(null)

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
          recipient: "256782226038@c.us" // WhatsApp group/number
        })
      })
      
      const data = await res.json()
      
      if (data.success || res.ok) {
        setOrderStatus('success')
        
        const newHistory = [...orderHistory, orderDetails]
        setOrderHistory(newHistory)
        localStorage.setItem('orderHistory', JSON.stringify(newHistory))
        
        setTimeout(() => {
          setCart({})
          setShowCustomerForm(false)
          setIsSendingOrder(false)
          setOrderStatus(null)
        }, 2500)
      } else {
        setOrderStatus('error')
        setTimeout(() => {
          setIsSendingOrder(false)
          setOrderStatus(null)
        }, 3000)
      }
    } catch (err) {
      console.error("❌ Error sending order:", err)
      setOrderStatus('error')
      setTimeout(() => {
        setIsSendingOrder(false)
        setOrderStatus(null)
      }, 3000)
    }
  }

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
    )
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
            <FaUndo style={{ marginRight: '8px' }} /> Try Again
          </button>
        </div>
      </div>
    )
  }

  const ProductDetailsModal = () => {
    if (!selectedProduct) return null

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={() => setSelectedProduct(null)}>
        <div style={{
          backgroundColor: CARD_BACKGROUND,
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setSelectedProduct(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                fontSize: '18px',
                color: TEXT_COLOR
              }}
            >
              <FaTimes />
            </button>
            <img 
              src={selectedProduct.image} 
              alt={selectedProduct.name}
              style={{
                width: '100%',
                height: '300px',
                objectFit: 'contain',
                borderRadius: '12px 12px 0 0'
              }}
            />
          </div>
          <div style={{ padding: '30px' }}>
            <h2 style={{ margin: '0 0 10px 0', color: TEXT_COLOR }}>{selectedProduct.name}</h2>
            <p style={{ margin: '0 0 15px 0', color: LIGHT_TEXT_COLOR, fontSize: '14px' }}>
              Brand: <strong>{selectedProduct.brand}</strong> | Category: <strong>{selectedProduct.category}</strong>
            </p>
            <p style={{ margin: '0 0 20px 0', color: TEXT_COLOR, lineHeight: '1.6' }}>
              {selectedProduct.description}
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #eee',
              paddingTop: '20px'
            }}>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: PRIMARY_COLOR }}>
                UGX {selectedProduct.price.toLocaleString()}
              </span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => updateQuantity(selectedProduct.id, -1)}
                  disabled={!cart[selectedProduct.id]}
                  style={{
                    width: '28px',
                    height: '28px',
                    background: cart[selectedProduct.id] > 0 ? DANGER_COLOR : '#e9ecef',
                    cursor: cart[selectedProduct.id] > 0 ? 'pointer' : 'not-allowed',
                    borderRadius: '4px',
                    border: 'none',
                    color: cart[selectedProduct.id] > 0 ? 'white' : LIGHT_TEXT_COLOR,
                    fontSize: '20px',
                    alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                display:'flex'
                  }}
                >
                  −
                </button>
                <span style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>
                  {cart[selectedProduct.id] || 0}
                </span>
                <button
                  onClick={() => updateQuantity(selectedProduct.id, 1)}
                  style={{
                    width: '28px',
                height: '28px',
                borderRadius: '4px',
                border: 'none',
                background: ACCENT_COLOR,
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCustomerInfoModal = () => {
    if (!showCustomerForm) return null

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes slideIn {
            from {
              transform: translateY(-20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          @keyframes checkmark {
            0% {
              transform: scale(0) rotate(45deg);
            }
            50% {
              transform: scale(1.2) rotate(45deg);
            }
            100% {
              transform: scale(1) rotate(45deg);
            }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
        `}</style>
        <div style={{
          backgroundColor: CARD_BACKGROUND,
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}>
          
          {isSendingOrder && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}>
              {orderStatus === null && (
                <>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    border: `4px solid ${BACKGROUND_COLOR}`,
                    borderTop: `4px solid ${PRIMARY_COLOR}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '20px'
                  }} />
                  <p style={{ 
                    color: PRIMARY_COLOR, 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    margin: 0
                  }}>
                    Sending your order...
                  </p>
                  <p style={{ 
                    color: LIGHT_TEXT_COLOR, 
                    fontSize: '14px',
                    margin: '10px 0 0 0'
                  }}>
                    Please wait
                  </p>
                </>
              )}
              
              {orderStatus === 'success' && (
                <div style={{ 
                  textAlign: 'center',
                  animation: 'slideIn 0.3s ease-out'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: `${ACCENT_COLOR}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '30px',
                      height: '15px',
                      borderLeft: `4px solid ${ACCENT_COLOR}`,
                      borderBottom: `4px solid ${ACCENT_COLOR}`,
                      transform: 'rotate(-45deg)',
                      animation: 'checkmark 0.5s ease-out'
                    }} />
                  </div>
                  <h3 style={{ 
                    color: ACCENT_COLOR, 
                    fontSize: '22px', 
                    margin: '0 0 10px 0',
                    fontWeight: 'bold'
                  }}>
                    Order Sent Successfully!
                  </h3>
                  <p style={{ 
                    color: TEXT_COLOR, 
                    fontSize: '14px',
                    margin: 0
                  }}>
                    Check your WhatsApp for confirmation
                  </p>
                </div>
              )}
              
              {orderStatus === 'error' && (
                <div style={{ 
                  textAlign: 'center',
                  animation: 'slideIn 0.3s ease-out'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: `${DANGER_COLOR}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    animation: 'shake 0.5s ease-out'
                  }}>
                    <div style={{
                      fontSize: '40px',
                      color: DANGER_COLOR
                    }}>
                      ✕
                    </div>
                  </div>
                  <h3 style={{ 
                    color: DANGER_COLOR, 
                    fontSize: '22px', 
                    margin: '0 0 10px 0',
                    fontWeight: 'bold'
                  }}>
                    Failed to Send Order
                  </h3>
                  <p style={{ 
                    color: TEXT_COLOR, 
                    fontSize: '14px',
                    margin: '0 0 15px 0'
                  }}>
                    Please check your connection and try again
                  </p>
                  <button
                    onClick={() => {
                      setIsSendingOrder(false)
                      setOrderStatus(null)
                    }}
                    style={{
                      padding: '8px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      background: DANGER_COLOR,
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}

          <h2 style={{ margin: '0 0 20px 0', color: TEXT_COLOR }}>Your Information</h2>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: TEXT_COLOR, fontWeight: 'bold' }}>
              Name *
            </label>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              placeholder="Enter your name"
              autoComplete="name"
              disabled={isSendingOrder}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                outline: 'none',
                opacity: isSendingOrder ? 0.6 : 1
              }}
              onFocus={(e) => !isSendingOrder && (e.target.style.borderColor = PRIMARY_COLOR)}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: TEXT_COLOR, fontWeight: 'bold' }}>
              Phone Number *
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              placeholder="e.g., 0700123456"
              autoComplete="tel"
              disabled={isSendingOrder}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                outline: 'none',
                opacity: isSendingOrder ? 0.6 : 1
              }}
              onFocus={(e) => !isSendingOrder && (e.target.style.borderColor = PRIMARY_COLOR)}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowCustomerForm(false)}
              disabled={isSendingOrder}
              style={{
                flex: 1,
                padding: '12px',
                border: `1px solid ${PRIMARY_COLOR}`,
                borderRadius: '8px',
                background: 'white',
                color: PRIMARY_COLOR,
                cursor: isSendingOrder ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: isSendingOrder ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (customerInfo.name.trim() && customerInfo.phone.trim()) {
                  localStorage.setItem('customerInfo', JSON.stringify(customerInfo))
                  proceedWithOrder()
                } else {
                  alert('Please fill in all fields')
                }
              }}
              disabled={isSendingOrder}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                background: ACCENT_COLOR,
                color: 'white',
                cursor: isSendingOrder ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: isSendingOrder ? 0.6 : 1
              }}
            >
              {isSendingOrder ? 'Sending...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const OrderHistoryModal = () => {
    if (!showOrderHistory) return null

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: CARD_BACKGROUND,
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: CARD_BACKGROUND
          }}>
            <h2 style={{ margin: 0, color: TEXT_COLOR }}>Order History</h2>
            <button
              onClick={() => setShowOrderHistory(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                color: TEXT_COLOR
              }}
            >
              <FaTimes />
            </button>
          </div>
          <div style={{ padding: '20px' }}>
            {orderHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: LIGHT_TEXT_COLOR }}>No orders yet</p>
            ) : (
              orderHistory.slice().reverse().map((order, idx) => (
                <div key={idx} style={{
                  padding: '15px',
                  marginBottom: '15px',
                  border: '1px solid #eee',
                  borderRadius: '8px'
                }}>
                  <div style={{ marginBottom: '10px', fontSize: '12px', color: LIGHT_TEXT_COLOR }}>
                    {order.date}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>{order.customer.name}</strong> ({order.customer.phone})
                  </div>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ fontSize: '14px', color: TEXT_COLOR }}>
                      {item.name} × {item.qty} - UGX {(item.price * item.qty).toLocaleString()}
                    </div>
                  ))}
                  <div style={{
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid #eee',
                    fontWeight: 'bold',
                    color: PRIMARY_COLOR
                  }}>
                    Total: UGX {order.total.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  const ProductCard = ({ product }) => {
    const currentQuantity = cart[product.id] || 0

    return (
      <div style={{
        border: 'none',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: CARD_BACKGROUND,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '220px',
        transition: 'transform 0.3s ease-in-out',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      onClick={() => setSelectedProduct(product)}>
        {product.image && (
          <div style={{
            width: '100%',
            height: '150px',
            backgroundColor: '#f0f0f0',
            borderBottom: '1px solid #eee',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <img style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            src={product.image}
            alt={product.name}
            onError={(e) => {
              if (product.imageAlt) {
                e.target.src = product.imageAlt
              } else {
                e.target.src = 'https://via.placeholder.com/220x150/ADB5BD/FFFFFF?text=' + encodeURIComponent(product.name.substring(0, 15))
              }
            }}
            />
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(255,255,255,0.9)',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              color: PRIMARY_COLOR
            }}>
              <FaInfoCircle style={{ marginRight: '4px' }} />
              Details
            </div>
          </div>
        )}
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: TEXT_COLOR, fontWeight: 600 }} title={product.name}>
            {product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name}
          </h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: LIGHT_TEXT_COLOR, flexGrow: 1 }} title={product.description}>
            {product.description.substring(0, 45) + (product.description.length > 45 ? '...' : '')}
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '8px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <span style={{ fontSize: '16px', fontWeight: '700', color: PRIMARY_COLOR }}>
              UGX {product.price.toLocaleString()}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={(e) => e.stopPropagation()}>
              <button
                style={{
                  width: '28px',
                  height: '28px',
                  background: currentQuantity > 0 ? DANGER_COLOR : '#e9ecef',
                  cursor: currentQuantity > 0 ? 'pointer' : 'not-allowed',
                  borderRadius: '4px',
                  border: 'none',
                  color: currentQuantity > 0 ? 'white' : LIGHT_TEXT_COLOR,
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                onClick={() => updateQuantity(product.id, -1)}
                disabled={!currentQuantity}
              >
                −
              </button>
              <span style={{ 
                minWidth: '25px', 
                textAlign: 'center', 
                fontWeight: '600', 
                color: TEXT_COLOR, 
                fontSize: '15px',
                lineHeight: '28px'
              }}>
                {currentQuantity}
              </span>
              <button style={{
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                border: 'none',
                background: ACCENT_COLOR,
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
              onClick={() => updateQuantity(product.id, 1)}>
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CategorySection = ({ categoryName, showAll = false }) => {
    const categoryProducts = getProductsByCategory(categoryName)
    const displayProducts = showAll ? categoryProducts : categoryProducts.slice(0, 6)

    if (categoryProducts.length === 0) return null

    return (
      <div style={{ marginBottom: '40px', padding: '0 10px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px',
          borderBottom: `3px solid ${PRIMARY_COLOR}20`,
          paddingBottom: '10px'
        }}>
          <h2 style={{ margin: '0', color: PRIMARY_COLOR, fontSize: '24px', fontWeight: 700 }}>
            {categoryName}
            <span style={{ fontSize: '14px', color: LIGHT_TEXT_COLOR, fontWeight: 400, marginLeft: '8px' }}>
              ({categoryProducts.length} items)
            </span>
          </h2>
          {!showAll && categoryProducts.length > 3 && (
            <button
              style={{
                background: PRIMARY_COLOR,
                color: CARD_BACKGROUND,
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0, 123, 255, 0.3)'
              }}
              onClick={() => setSelectedCategory(categoryName)}
            >
              View All →
            </button>
          )}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '30px',
          justifyItems: 'center',
          padding: '20px 0'
        }}>
          {displayProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    )
  }

  const renderSearchFilterBar = () => (
    <div style={{
      backgroundColor: CARD_BACKGROUND,
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      <div style={{
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
          <FaSearch style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: LIGHT_TEXT_COLOR
          }} />
          <input
            type="text"
            placeholder="Search products, brands, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            style={{
              width: '100%',
              padding: '12px 12px 12px 45px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: LIGHT_TEXT_COLOR,
                fontSize: '16px'
              }}
            >
              <FaTimes />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '12px 20px',
            border: `1px solid ${PRIMARY_COLOR}`,
            borderRadius: '8px',
            background: showFilters ? PRIMARY_COLOR : 'white',
            color: showFilters ? 'white' : PRIMARY_COLOR,
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FaFilter /> Filters
        </button>
        <button
          onClick={() => setShowOrderHistory(true)}
          style={{
            padding: '12px 20px',
            border: `1px solid ${PRIMARY_COLOR}`,
            borderRadius: '8px',
            background: 'white',
            color: PRIMARY_COLOR,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📋 Order History ({orderHistory.length})
        </button>
      </div>
      
      {showFilters && (
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #eee'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: TEXT_COLOR }}>Price Range</h4>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: LIGHT_TEXT_COLOR, marginBottom: '5px' }}>
                Min Price
              </label>
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                autoComplete="off"
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  width: '120px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: LIGHT_TEXT_COLOR, marginBottom: '5px' }}>
                Max Price
              </label>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                autoComplete="off"
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  width: '120px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>
            <button
              onClick={() => {
                const prices = products.map(p => p.price)
                setPriceRange({ min: Math.min(...prices), max: Math.max(...prices) })
              }}
              style={{
                padding: '8px 16px',
                marginTop: '18px',
                border: 'none',
                borderRadius: '6px',
                background: LIGHT_TEXT_COLOR,
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Reset
            </button>
          </div>
          <div style={{ marginTop: '10px', fontSize: '14px', color: LIGHT_TEXT_COLOR }}>
            Showing products from UGX {priceRange.min.toLocaleString()} to UGX {priceRange.max.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )

  if (selectedCategory) {
    return (
      <div style={{ padding: '0 20px', backgroundColor: BACKGROUND_COLOR, minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            position: 'sticky',
            top: '0',
            zIndex: 20,
            backgroundColor: CARD_BACKGROUND,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 0',
            marginBottom: '20px',
            borderBottom: `2px solid ${PRIMARY_COLOR}`
          }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                background: 'none',
                border: `1px solid ${PRIMARY_COLOR}`,
                color: PRIMARY_COLOR,
                padding: '10px 15px',
                borderRadius: '30px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              <FaArrowLeft style={{ marginRight: '8px' }} /> Back to All Categories
            </button>
            {getTotalItems() > 0 && (
              <button
                onClick={handleWhatsAppOrder}
                disabled={getTotalPrice() < 200000}
                style={{
                  background: getTotalPrice() >= 200000 ? ACCENT_COLOR : '#999',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '30px',
                  cursor: getTotalPrice() >= 200000 ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  boxShadow: getTotalPrice() >= 200000 ? '0 4px 10px rgba(40, 167, 69, 0.4)' : 'none',
                  opacity: getTotalPrice() >= 200000 ? 1 : 0.7,
                  transition: 'all 0.3s ease'
                }}
              >
                <FaWhatsapp style={{ marginRight: '8px' }} /> 
                {getTotalPrice() >= 200000 
                  ? `Order ${getTotalItems()} Items (UGX ${getTotalPrice().toLocaleString()})` 
                  : 'Minimum UGX 200,000'
                }
              </button>
            )}
          </div>
          <CategorySection categoryName={selectedCategory} showAll={true} />
        </div>
        <ProductDetailsModal />
        {renderCustomerInfoModal()}
        <OrderHistoryModal />
      </div>
    )
  }

return (
  <div style={{ backgroundColor: BACKGROUND_COLOR, minHeight: '100vh', paddingBottom: '50px' }}>
    {/* CART SUMMARY (STICKY ON TOP) */}
    {getTotalItems() > 0 && (
      <div
        ref={cartRef}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 200,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: CARD_BACKGROUND,
          padding: isScrolled ? '8px 15px' : '12px 20px',
          borderRadius: '10px',
          margin: '12px auto 20px auto',
          maxWidth: '1200px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          borderLeft: `5px solid ${getTotalPrice() >= 200000 ? ACCENT_COLOR : DANGER_COLOR}`,
          transition: 'all 0.3s ease',
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: TEXT_COLOR, fontSize: isScrolled ? '14px' : '16px' }}>
            🛍️ Your Cart:{" "}
            <span
              style={{
                color: getTotalPrice() >= 200000 ? ACCENT_COLOR : DANGER_COLOR,
                fontWeight: 700,
              }}
            >
              {getTotalItems()} items
            </span>
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: TEXT_COLOR }}>
            Total: UGX {getTotalPrice().toLocaleString()}
          </p>
          {getTotalPrice() < 200000 ? (
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: DANGER_COLOR, fontWeight: 'bold' }}>
              ⚠️ Add UGX {(200000 - getTotalPrice()).toLocaleString()} more (Min UGX 200,000)
            </p>
          ) : (
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: ACCENT_COLOR, fontWeight: 'bold' }}>
              ✅ Ready to order!
            </p>
          )}
        </div>

        <button
          onClick={handleWhatsAppOrder}
          disabled={getTotalPrice() < 200000}
          style={{
            background: getTotalPrice() >= 200000 ? ACCENT_COLOR : '#999',
            color: 'white',
            border: 'none',
            padding: isScrolled ? '8px 15px' : '10px 20px',
            borderRadius: '25px',
            cursor: getTotalPrice() >= 200000 ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            boxShadow: getTotalPrice() >= 200000 ? '0 3px 8px rgba(40,167,69,0.4)' : 'none',
            opacity: getTotalPrice() >= 200000 ? 1 : 0.7,
            transition: 'all 0.3s ease',
          }}
        >
          <FaWhatsapp style={{ marginRight: '6px' }} />{" "}
          {getTotalPrice() >= 200000 ? "Order via WhatsApp" : "Below Minimum"}
        </button>
      </div>
    )}

    {/* STICKY HEADER + SEARCH */}
    <div
      style={{
        position: 'sticky',
        top: getTotalItems() > 0 ? `${cartHeight}px` : '0',
        zIndex: 100,
        backgroundColor: BACKGROUND_COLOR,
        transition: 'all 0.3s ease',
        boxShadow: isScrolled ? '0 3px 8px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 15px' }}>
        {/* HEADER */}
        <div
          style={{
            textAlign: 'center',
            padding: isScrolled ? '6px 0' : '12px 0',
            marginBottom: isScrolled ? '4px' : '10px',
            background: CARD_BACKGROUND,
            borderRadius: isScrolled ? '0' : '8px',
            boxShadow: isScrolled ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
            transform: isScrolled ? 'scale(0.97)' : 'scale(1)',
            transition: 'all 0.3s ease',
          }}
        >
          <h1
            style={{
              margin: '0 0 4px 0',
              color: PRIMARY_COLOR,
              fontSize: isScrolled ? '20px' : '24px',
              fontWeight: 700,
              transition: 'font-size 0.3s ease',
            }}
          >
            <FaShoppingCart
              style={{
                marginRight: isScrolled ? '4px' : '6px',
                transform: isScrolled ? 'scale(0.85)' : 'scale(1)',
                transition: 'transform 0.3s ease',
              }}
            />{" "}
            Kookee Online Shop
          </h1>
          {!isScrolled && (
            <>
              <p style={{ margin: '0 0 2px 0', fontSize: '14px', color: TEXT_COLOR }}>
                Premium Cosmetic Oils, Fresh Dairy & Quality Spices
              </p>
              <p style={{ margin: '0', fontSize: '12px', color: LIGHT_TEXT_COLOR }}>
                <span style={{ fontWeight: 600, color: PRIMARY_COLOR }}>
                  {getFilteredProducts().length}
                </span>{" "}
                of {products.length} Products
                {searchQuery && <span> matching "{searchQuery}"</span>}
              </p>
            </>
          )}
        </div>

        {/* SEARCH / FILTER BAR */}
        <div
          style={{
            background: CARD_BACKGROUND,
            padding: isScrolled ? '6px 10px' : '10px 12px',
            borderRadius: isScrolled ? '0' : '6px',
            marginBottom: isScrolled ? '4px' : '8px',
            boxShadow: isScrolled ? '0 1px 3px rgba(0,0,0,0.05)' : '0 2px 6px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
          }}
        >
          {renderSearchFilterBar()}
        </div>
      </div>
    </div>

    {/* EMPTY STATE */}
    {getFilteredProducts().length === 0 && (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 15px',
          backgroundColor: CARD_BACKGROUND,
          borderRadius: '10px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          margin: '15px',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔍</div>
        <h3 style={{ color: TEXT_COLOR, marginBottom: '8px' }}>No products found</h3>
        <p style={{ color: LIGHT_TEXT_COLOR, marginBottom: '15px' }}>
          Try adjusting your search or filters
        </p>
        <button
          onClick={() => {
            setSearchQuery("");
            const prices = products.map((p) => p.price);
            setPriceRange({
              min: Math.min(...prices),
              max: Math.max(...prices),
            });
          }}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            background: PRIMARY_COLOR,
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Clear All Filters
        </button>
      </div>
    )}

    {/* PRODUCT SECTIONS */}
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 15px' }}>
      {categories.map((category) => (
        <CategorySection key={category} categoryName={category} />
      ))}
    </div>

    <ProductDetailsModal />
    {renderCustomerInfoModal()}
    <OrderHistoryModal />
  </div>
);

}

export default App