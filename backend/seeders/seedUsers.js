const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
  const password = await bcrypt.hash('admin123', 12);
  const users = [
    { name: 'Admin User',    email: 'admin@posquality.com',   role: 'admin' },
    { name: 'Manager One',   email: 'manager@posquality.com', role: 'manager' },
    { name: 'Cashier Staff', email: 'cashier@posquality.com', role: 'cashier' },
  ];

  for (const u of users) {
    await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
      [u.name, u.email, password, u.role]
    );
  }
  console.log('✅ Users seeded');
};

module.exports = { seedUsers };
