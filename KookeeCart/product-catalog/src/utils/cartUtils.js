export const getTotalItems = (cart) => {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
};

export const getTotalPrice = (cart, products) => {
  const total = Object.entries(cart).reduce((sum, [productId, qty]) => {
    const product = products.find(p => p.id === parseInt(productId));
    return sum + (product ? product.price * qty : 0);
  }, 0);
  return total;
};

export const updateQuantity = (cart, productId, change) => {
  return {
    ...cart,
    [productId]: Math.max(0, (cart[productId] || 0) + change)
  };
};
