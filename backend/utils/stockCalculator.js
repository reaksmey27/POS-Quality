const getStockStatus = (stock) => {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= 10) return 'Low Stock';
  return 'In Stock';
};

const calculateStockValue = (products) => {
  return products.reduce((acc, p) => acc + p.stock * p.cost_price, 0);
};

const calculateRetailValue = (products) => {
  return products.reduce((acc, p) => acc + p.stock * p.price, 0);
};

const getPotentialMargin = (products) => {
  const cost = calculateStockValue(products);
  const retail = calculateRetailValue(products);
  if (cost === 0) return 0;
  return ((retail - cost) / retail * 100).toFixed(1);
};

const getLowStockProducts = (products, threshold = 10) => {
  return products.filter(p => p.stock <= threshold && p.stock > 0);
};

const getOutOfStockProducts = (products) => {
  return products.filter(p => p.stock === 0);
};

const adjustStock = (currentStock, quantity, type) => {
  switch (type) {
    case 'sale':       return Math.max(0, currentStock - quantity);
    case 'restock':    return currentStock + quantity;
    case 'adjustment': return Math.max(0, currentStock + quantity);
    case 'return':     return currentStock + quantity;
    case 'loss':       return Math.max(0, currentStock - quantity);
    default:           return currentStock;
  }
};

module.exports = {
  getStockStatus,
  calculateStockValue,
  calculateRetailValue,
  getPotentialMargin,
  getLowStockProducts,
  getOutOfStockProducts,
  adjustStock,
};
