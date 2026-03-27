const { pool } = require('../config/db');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { v4: uuidv4 } = require('uuid');

exports.getAll = asyncHandler(async (req, res) => {
  const { category, search, status, sortBy = 'name', order = 'ASC', page = 1, limit = 50 } = req.query;

  let query = `
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (category) { query += ' AND c.name = ?'; params.push(category); }
  if (status) { query += ' AND p.status = ?'; params.push(status); }
  if (search) { query += ' AND (p.name LIKE ? OR p.sku LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const allowedSort = ['name', 'price', 'stock', 'created_at', 'sales_volume'];
  const sortCol = allowedSort.includes(sortBy) ? sortBy : 'name';
  query += ` ORDER BY p.${sortCol} ${order === 'DESC' ? 'DESC' : 'ASC'}`;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const [rows] = await pool.execute(query, params);
  res.json({ success: true, data: rows });
});

exports.getById = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Product not found', 404);
  res.json({ success: true, data: rows[0] });
});

exports.getBySku = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM products WHERE sku = ?', [req.params.sku]);
  if (!rows.length) throw new AppError('Product not found', 404);
  res.json({ success: true, data: rows[0] });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, sku, description, price, cost_price, stock, category_id, image, barcode } = req.body;
  const status = stock > 10 ? 'In Stock' : stock > 0 ? 'Low Stock' : 'Out of Stock';

  const [existing] = await pool.execute('SELECT id FROM products WHERE sku = ?', [sku]);
  if (existing.length > 0) throw new AppError('SKU already exists', 409);

  const [result] = await pool.execute(
    `INSERT INTO products (name, sku, description, price, cost_price, stock, category_id, image, barcode, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, sku, description || '', price, cost_price || 0, stock || 0, category_id, image || '', barcode || '', status]
  );

  await pool.execute(
    'INSERT INTO stock_movements (product_id, type, quantity, notes, user_id) VALUES (?, ?, ?, ?, ?)',
    [result.insertId, 'initial', stock || 0, 'Initial stock', req.user?.id || null]
  );

  const [newProduct] = await pool.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, data: newProduct[0] });
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, cost_price, stock, category_id, image, barcode } = req.body;

  const [existing] = await pool.execute('SELECT id, stock FROM products WHERE id = ?', [id]);
  if (!existing.length) throw new AppError('Product not found', 404);

  const newStock = stock ?? existing[0].stock;
  const status = newStock > 10 ? 'In Stock' : newStock > 0 ? 'Low Stock' : 'Out of Stock';

  await pool.execute(
    `UPDATE products SET name=?, description=?, price=?, cost_price=?, stock=?, category_id=?, image=?, barcode=?, status=?, updated_at=NOW() WHERE id=?`,
    [name, description, price, cost_price || 0, newStock, category_id, image || '', barcode || '', status, id]
  );

  const stockDiff = newStock - existing[0].stock;
  if (stock !== undefined && stockDiff !== 0) {
    await pool.execute(
      'INSERT INTO stock_movements (product_id, type, quantity, notes, user_id) VALUES (?, ?, ?, ?, ?)',
      [id, stockDiff > 0 ? 'restock' : 'adjustment', Math.abs(stockDiff), 'Manual update', req.user?.id || null]
    );
  }

  const [updated] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
  res.json({ success: true, data: updated[0] });
});

exports.delete = asyncHandler(async (req, res) => {
  const [existing] = await pool.execute('SELECT id FROM products WHERE id = ?', [req.params.id]);
  if (!existing.length) throw new AppError('Product not found', 404);
  await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Product deleted' });
});

exports.getLowStock = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;
  const [rows] = await pool.execute('SELECT * FROM products WHERE stock <= ? ORDER BY stock ASC', [threshold]);
  res.json({ success: true, data: rows });
});

exports.updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, type = 'adjustment', notes = '' } = req.body;

  const [existing] = await pool.execute('SELECT id, stock FROM products WHERE id = ?', [id]);
  if (!existing.length) throw new AppError('Product not found', 404);

  const newStock = Math.max(0, existing[0].stock + parseInt(quantity));
  const status = newStock > 10 ? 'In Stock' : newStock > 0 ? 'Low Stock' : 'Out of Stock';

  await pool.execute('UPDATE products SET stock = ?, status = ?, updated_at = NOW() WHERE id = ?', [newStock, status, id]);
  await pool.execute(
    'INSERT INTO stock_movements (product_id, type, quantity, notes, user_id) VALUES (?, ?, ?, ?, ?)',
    [id, type, Math.abs(parseInt(quantity)), notes, req.user?.id || null]
  );

  res.json({ success: true, data: { id, stock: newStock, status } });
});
