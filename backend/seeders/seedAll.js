require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { connectDB } = require('../config/db');
const { seedUsers } = require('./seedUsers');
const { seedCategories } = require('./seedCategories');
const { seedProducts } = require('./seedProducts');

const seedAll = async () => {
  console.log('🌱 Starting database seeding...\n');
  await connectDB();
  await seedUsers();
  await seedCategories();
  await seedProducts();
  console.log('\n✅ All data seeded successfully!');
  console.log('📧 Default credentials: admin@posquality.com / admin123');
  process.exit(0);
};

seedAll().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});
