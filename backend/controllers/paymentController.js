const { pool } = require('../config/db');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

exports.getAll = asyncHandler(async (req, res) => {
  const { order_id } = req.query;
  let query = 'SELECT p.*, o.total AS order_total FROM payments p LEFT JOIN orders o ON p.order_id = o.id WHERE 1=1';
  const params = [];
  if (order_id) { query += ' AND p.order_id = ?'; params.push(order_id); }
  query += ' ORDER BY p.created_at DESC';
  const [rows] = await pool.execute(query, params);
  res.json({ success: true, data: rows });
});

exports.getById = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM payments WHERE id = ?', [req.params.id]);
  if (!rows.length) throw new AppError('Payment not found', 404);
  res.json({ success: true, data: rows[0] });
});

exports.getMethodSummary = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT payment_method, COUNT(*) AS count, SUM(amount) AS total
    FROM payments
    WHERE DATE(created_at) = CURDATE()
    GROUP BY payment_method
  `);
  res.json({ success: true, data: rows });
});
