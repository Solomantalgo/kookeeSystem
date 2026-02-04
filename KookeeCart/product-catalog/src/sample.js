import React,{useState} from "react";
import "./App.css";
const products = [
  {
    id: 1,
    name:'icecream 120ml',
    price:1000,
    image:'/images/120ml.jpg',
    category: 'Icecream',
  },
  {
    id: 2,
    name:'icecream 250ml',
    price:2000,
    image:'/images/250ml.jpg',
    category: 'Icecream',
  },
  {
    id: 3,
    name:'icecream 500ml',
    price:3000,
    image:'/images/500ml.jpg',
    category: 'Icecream',
  },
  {
    id: 4,
    name:'icecream 1L',
    price:4000,
    image:'/images/500ml.jpg',
    category: 'Ice',
  },
  {
    id: 5,
    name:'icecream 2L',
    price:8000,
    image:'/images/250ml.jpg',
    category: 'Ice',
  },
  {
    id: 2,
    name:'icecream 250ml',
    price:2000,
    image:'/images/250ml.jpg',
    category: 'Ice',
  },
  {
    id: 3,
    name:'icecream 500ml',
    price:3000,
    image:'/images/500ml.jpg',
    category: 'cream',
  }
]

function App() {
  const [cart, setCart] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);

  const updateQuantity = (productId, change) => {
    setCart(prevCart =>{
      const currentQty = prevCart[productId] || 0;
      const newQty = Math.max(0, currentQty +change);
      return { ...prevCart, [productId]: newQty };
    });
  };

  const totalItems = Object.values(cart).reduce((a,b) => a+b,0);
  const totalPrice = products.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);

const handleWhatsAppOrder = () => {
  if (totalItems === 0) {
    alert("Your cart is empty!");
    return;
  }

  let message = "🛒 Kookee Order:\n\n";

  products.forEach(p => {
    if (cart[p.id]) {
      message += `${p.name} x${cart[p.id]} = UGX ${(p.price * cart[p.id]).toLocaleString()}\n`;
      
    }
  }

  );
  message += `\nTotal: UGX ${totalPrice.toLocaleString()}\n\nThank you for your order!`;

  const phone = "+256742311378"; // replace with your WhatsApp number
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
};

//category block
const categories = [...new Set(products.map(p => p.category))];

const CategoryBlock = ({category}) => {
  const items = products.filter(p => p.category === category);
  const ShowItems = selectedCategory === category? items : items.slice(0,2);

  return (
    <div className="category-block">
      <h2>{category} ({items.length})</h2>
      <div className="header">
        {items.length > 1 && selectedCategory !== category && (
          <button onClick={() => setSelectedCategory(category)}>
            See All
          </button>
        )}

        <div className="product-grid">
          {ShowItems.map(p => (
            <div className="product-card" key={p.id}>
              <img src={p.image}  alt={p.name}/>
              <h3>{p.name}</h3>
              <h3>{p.category}</h3>
              <p>UGX {p.price.toLocaleString()}</p>
              <div className="controls">
              <button onClick={() => updateQuantity(p.id, -1)}>-</button>
              <span>{cart[p.id]}</span>
              <button onClick={() => updateQuantity(p.id, +1)}>+</button>
              </div>
            </div>
          ))}
          </div>
      </div>
    </div>
  )
};

return (
<div className="App">
 <h1>Kookee Catalog</h1>
 {/*<div className="product-grid">
    {products.map(product => (
      <div key={product.id} className="product-card">
        <img src={product.image} alt={product.name} />
        <h3>{product.name}</h3>
        <h3>{product.category}</h3>
        <p>UGX{product.price.toLocaleString()}</p>

        <div className = "controls">
      <button onClick = {() => updateQuantity(product.id, -1)}>-</button>
      <span>{cart[product.id] || 0}</span>
      <button onClick = {() => updateQuantity(product.id, +1)} >+</button>
    </div>
      </div>
    ))}
    </div>} */}

    <div className = "cart-summary">
      <h2>Cart Summary</h2>
      <p>Total Items: {totalItems} </p>
      <p>Total Price: UGX{totalPrice.toLocaleString()}</p>
    <button className = "whatsapp-btn" onClick = {handleWhatsAppOrder}>
      Order via whatsapp
    </button>
    </div>
{/* category blocks */}
{categories.map(cat => (
<CategoryBlock key={cat} category={cat}/>)
)}
</div>
);
}
export default App;