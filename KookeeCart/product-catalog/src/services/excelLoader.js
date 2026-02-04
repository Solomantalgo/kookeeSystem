import * as XLSX from 'xlsx';

export const loadExcelFromUrl = async (url) => {
  try {
    console.log('Loading data from Excel');
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log('Raw Excel data (first row):', jsonData[0]);
    console.log('Available columns:', Object.keys(jsonData[0] || {}));

    const validProducts = jsonData.map((row, index) => {
      const productId = row.id || row.ID || row.Id || (index + 1);
      
      const product = {
        id: Number(productId),
        name: String(row.name || row.Name || row.NAME || '').trim(),
        brand: String(row.brand || row.Brand || row.BRAND || '').trim(),
        category: String(row.category || row.Category || row.CATEGORY || 'other').trim(),
        price: parseFloat(String(row.price || row.Price || row.PRICE || '0').replace(/[^0-9.]/g, '')),
        description: String(row.description || row.Description || row.DESCRIPTION || '').trim(),
        image: String(row.image || row.Image || row.IMAGE || '').trim().replace(/\s/g, ''),
        imageAlt: row.imageAlt || row.ImageAlt
      };
      
      console.log(`Product ${index + 1}:`, product);
      return product;
    });

    console.log('Total products loaded:', validProducts.length);

    return {
      products: validProducts,
      priceRange: {
        min: Math.min(...validProducts.map(p => p.price)),
        max: Math.max(...validProducts.map(p => p.price))
      }
    };
  } catch (err) {
    console.error('Error loading Excel', err);
    throw new Error('Could not load catalog data. Please check the Excel URL.');
  }
};