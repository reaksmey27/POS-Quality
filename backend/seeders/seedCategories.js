const { pool } = require('../config/db');

const seedCategories = async () => {
  const categories = [
    { name: 'Beverages',    description: 'Hot and cold drinks',          color: '#004ac6', icon: 'Coffee' },
    { name: 'Bakery',       description: 'Fresh baked goods',            color: '#943700', icon: 'Croissant' },
    { name: 'Food',         description: 'Main meals and snacks',        color: '#15803d', icon: 'Utensils' },
    { name: 'Retail Goods', description: 'Packaged retail products',     color: '#7c3aed', icon: 'Package' },
    { name: 'Desserts',     description: 'Cakes, pastries and sweets',   color: '#db2777', icon: 'Cake' },
  ];

  for (const c of categories) {
    await pool.execute(
      'INSERT INTO categories (name, description, color, icon) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE description=VALUES(description)',
      [c.name, c.description, c.color, c.icon]
    );
  }
  console.log('✅ Categories seeded');
};

module.exports = { seedCategories };
