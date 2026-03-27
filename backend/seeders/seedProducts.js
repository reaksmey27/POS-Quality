const { pool } = require('../config/db');

const seedProducts = async () => {
  const [cats] = await pool.execute('SELECT id, name FROM categories');
  const catMap = Object.fromEntries(cats.map(c => [c.name, c.id]));

  const products = [
    { name: 'Iced Americano',   sku: 'BEV-001', price: 4.50, cost: 1.20, stock: 85,  cat: 'Beverages',    vol: 520 },
    { name: 'Caramel Latte',    sku: 'BEV-002', price: 5.25, cost: 1.50, stock: 72,  cat: 'Beverages',    vol: 480 },
    { name: 'Green Tea',        sku: 'BEV-003', price: 4.00, cost: 0.90, stock: 60,  cat: 'Beverages',    vol: 310 },
    { name: 'Croissant',        sku: 'BAK-001', price: 3.50, cost: 0.80, stock: 45,  cat: 'Bakery',       vol: 290 },
    { name: 'Sourdough Slice',  sku: 'BAK-002', price: 2.75, cost: 0.60, stock: 8,   cat: 'Bakery',       vol: 180 },
    { name: 'Club Sandwich',    sku: 'FOD-001', price: 8.50, cost: 2.50, stock: 30,  cat: 'Food',         vol: 150 },
    { name: 'Caesar Salad',     sku: 'FOD-002', price: 7.25, cost: 2.00, stock: 25,  cat: 'Food',         vol: 120 },
    { name: 'Mineral Water',    sku: 'RET-001', price: 1.50, cost: 0.40, stock: 200, cat: 'Retail Goods', vol: 650 },
    { name: 'Energy Drink',     sku: 'RET-002', price: 3.00, cost: 0.85, stock: 6,   cat: 'Retail Goods', vol: 340 },
    { name: 'Chocolate Cake',   sku: 'DES-001', price: 5.50, cost: 1.80, stock: 20,  cat: 'Desserts',     vol: 410 },
    { name: 'Cheesecake Slice', sku: 'DES-002', price: 5.00, cost: 1.60, stock: 15,  cat: 'Desserts',     vol: 380 },
    { name: 'Sparkling Water',  sku: 'BEV-004', price: 2.25, cost: 0.60, stock: 0,   cat: 'Beverages',    vol: 95  },
  ];

  for (const p of products) {
    const status = p.stock > 10 ? 'In Stock' : p.stock > 0 ? 'Low Stock' : 'Out of Stock';
    const trend = p.vol > 300 ? 'up' : p.vol > 150 ? 'neutral' : 'down';
    await pool.execute(
      `INSERT INTO products (name, sku, price, cost_price, stock, category_id, status, sales_volume, trend)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE stock=VALUES(stock), sales_volume=VALUES(sales_volume)`,
      [p.name, p.sku, p.price, p.cost, p.stock, catMap[p.cat] || null, status, p.vol, trend]
    );
  }
  console.log('✅ Products seeded');
};

module.exports = { seedProducts };
