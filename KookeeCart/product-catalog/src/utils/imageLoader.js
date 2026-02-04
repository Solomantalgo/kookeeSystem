// Image loading utilities for performance optimization

/**
 * Preloads an image
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Creates an Intersection Observer for lazy loading
 */
export const createLazyImageObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px', // Start loading 50px before image enters viewport
    threshold: 0.01,
    ...options
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        // Stop observing once loaded
        observer.unobserve(entry.target);
      }
    });
  }, defaultOptions);

  return observer;
};

/**
 * Preloads critical images (first few visible products)
 */
export const preloadCriticalImages = (products, count = 8) => {
  const criticalProducts = products.slice(0, count);
  const imagePromises = criticalProducts.map(product => {
    const cleanName = product.name ? product.name.replace(/[^a-zA-Z0-9]/g, '') : 'product';
    const webpSrc = `/images/${cleanName}.webp`;
    const jpgSrc = `/images/${cleanName}.jpg`;
    
    // Try WebP first, fallback to JPG
    return preloadImage(webpSrc).catch(() => {
      return preloadImage(jpgSrc);
    }).catch(() => {
      // Silently fail for missing images
      return null;
    });
  });
  
  return Promise.all(imagePromises);
};

/**
 * Gets image source with fallback (WebP first, then JPG)
 */
export const getImageSrc = (product) => {
  const cleanName = product.name ? product.name.replace(/[^a-zA-Z0-9]/g, '') : 'product';
  return `/images/${cleanName}.webp`;
};

/**
 * Gets fallback image source (JPG)
 */
export const getFallbackImageSrc = (product) => {
  const cleanName = product.name ? product.name.replace(/[^a-zA-Z0-9]/g, '') : 'product';
  return `/images/${cleanName}.jpg`;
};
