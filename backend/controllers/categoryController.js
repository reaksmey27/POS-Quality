const { pool } = require('../config/db');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

exports.getAll = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.name'
  );
  res.json({ success: true, data: rows });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, description, color, icon } = req.body;
  const [existing] = await pool.execute('SELECT id FROM categories WHERE name = ?', [name]);
  if (existing.length) throw new AppError('Category already exists', 409);
  const [result] = await pool.execute(
    'INSERT INTO categories (name, description, color, icon) VALUES (?, ?, ?, ?)',
    [name, description || '', color || '#004ac6', icon || 'Package']
  );
  const [cat] = await pool.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, data: cat[0] });
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, color, icon } = req.body;
  await pool.execute(
    'UPDATE categories SET name=?, description=?, color=?, icon=? WHERE id=?',
    [name, description || '', color || '#004ac6', icon || 'Package', id]
  );
  const [cat] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
  if (!cat.length) throw new AppError('Category not found', 404);
  res.json({ success: true, data: cat[0] });
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [products] = await pool.execute('SELECT id FROM products WHERE category_id = ?', [id]);
  if (products.length > 0) throw new AppError('Cannot delete category with associated products', 400);
  await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
  res.json({ success: true, message: 'Category deleted' });
});
