export const getFilteredProducts = (products, searchQuery, priceRange) => {
  return products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = p.price >= priceRange.min && p.price <= priceRange.max;
    return matchesSearch && matchesPrice;
  });
};

export const getProductsByCategory = (products, category, searchQuery, priceRange) => {
  return getFilteredProducts(products, searchQuery, priceRange).filter(p => p.category === category);
};

export const getCategories = (products, searchQuery, priceRange) => {
  return [...new Set(getFilteredProducts(products, searchQuery, priceRange).map(p => p.category))];
};