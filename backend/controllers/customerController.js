const { pool } = require('../config/db');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

exports.getAll = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params = [];
  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  const [rows] = await pool.execute(query, params);
  res.json({ success: true, data: rows });
});

exports.getById = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [req.params.id]);
  if (!rows.length) throw new AppError('Customer not found', 404);
  res.json({ success: true, data: rows[0] });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, phone, address, notes } = req.body;
  if (email) {
    const [exists] = await pool.execute('SELECT id FROM customers WHERE email = ?', [email]);
    if (exists.length) throw new AppError('Email already registered', 409);
  }
  const [result] = await pool.execute(
    'INSERT INTO customers (name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?)',
    [name, email || '', phone || '', address || '', notes || '']
  );
  const [c] = await pool.execute('SELECT * FROM customers WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, data: c[0] });
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, notes } = req.body;
  const [existing] = await pool.execute('SELECT id FROM customers WHERE id = ?', [id]);
  if (!existing.length) throw new AppError('Customer not found', 404);
  await pool.execute(
    'UPDATE customers SET name=?, email=?, phone=?, address=?, notes=?, updated_at=NOW() WHERE id=?',
    [name, email || '', phone || '', address || '', notes || '', id]
  );
  const [c] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
  res.json({ success: true, data: c[0] });
});

exports.delete = asyncHandler(async (req, res) => {
  const [existing] = await pool.execute('SELECT id FROM customers WHERE id = ?', [req.params.id]);
  if (!existing.length) throw new AppError('Customer not found', 404);
  await pool.execute('DELETE FROM customers WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Customer deleted' });
});

exports.getOrderHistory = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT o.*, p.payment_method FROM orders o LEFT JOIN payments p ON p.order_id = o.id WHERE o.customer_id = ? ORDER BY o.created_at DESC',
    [req.params.id]
  );
  res.json({ success: true, data: rows });
});
