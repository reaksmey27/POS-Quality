const { pool } = require('../config/db');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

exports.getAll = asyncHandler(async (req, res) => {
  const { startDate, endDate, status, page = 1, limit = 50 } = req.query;
  let query = `
    SELECT o.*, c.name AS customer_name, u.name AS cashier_name, p.payment_method
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND o.status = ?'; params.push(status); }
  if (startDate) { query += ' AND DATE(o.created_at) >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND DATE(o.created_at) <= ?'; params.push(endDate); }
  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  const [rows] = await pool.execute(query, params);
  res.json({ success: true, data: rows });
});

exports.getById = asyncHandler(async (req, res) => {
  const [orders] = await pool.execute(
    `SELECT o.*, c.name AS customer_name, u.name AS cashier_name FROM orders o
     LEFT JOIN customers c ON o.customer_id = c.id
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.id = ?`,
    [req.params.id]
  );
  if (!orders.length) throw new AppError('Order not found', 404);

  const [items] = await pool.execute(
    `SELECT oi.*, p.name AS product_name, p.image FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [req.params.id]
  );

  const [payment] = await pool.execute('SELECT * FROM payments WHERE order_id = ?', [req.params.id]);

  res.json({ success: true, data: { ...orders[0], items, payment: payment[0] || null } });
});

exports.create = asyncHandler(async (req, res) => {
  const { customer_id, items, subtotal, discount_amount, discount_code, tax, total, payment_method, payment_details, notes } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.execute(
      `INSERT INTO orders (user_id, customer_id, subtotal, discount_code, discount_amount, tax, total, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
      [req.user?.id || null, customer_id || null, subtotal, discount_code || null, discount_amount || 0, tax, total, notes || '']
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.productId, item.name, item.quantity, item.price, item.price * item.quantity]
      );
      await conn.execute(
        'UPDATE products SET stock = GREATEST(0, stock - ?), sales_volume = sales_volume + ?, updated_at = NOW() WHERE id = ?',
        [item.quantity, item.quantity, item.productId]
      );
      await conn.execute(
        'UPDATE products SET status = CASE WHEN stock = 0 THEN "Out of Stock" WHEN stock <= 10 THEN "Low Stock" ELSE "In Stock" END WHERE id = ?',
        [item.productId]
      );
    }

    await conn.execute(
      'INSERT INTO payments (order_id, payment_method, amount, payment_details) VALUES (?, ?, ?, ?)',
      [orderId, payment_method, total, JSON.stringify(payment_details || {})]
    );

    if (customer_id) {
      await conn.execute(
        'UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ?, last_order_date = NOW() WHERE id = ?',
        [total, customer_id]
      );
    }

    await conn.commit();

    const [newOrder] = await conn.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
    res.status(201).json({ success: true, data: newOrder[0] });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'completed', 'refunded', 'cancelled'];
  if (!validStatuses.includes(status)) throw new AppError('Invalid status', 400);
  await pool.execute('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
  res.json({ success: true, message: 'Order status updated' });
});

exports.getTodaySummary = asyncHandler(async (req, res) => {
  const [summary] = await pool.execute(`
    SELECT
      COUNT(*) AS total_orders,
      SUM(total) AS total_revenue,
      AVG(total) AS avg_order_value,
      SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunded_count
    FROM orders
    WHERE DATE(created_at) = CURDATE()
  `);
  res.json({ success: true, data: summary[0] });
});

exports.refundOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
  if (!orders.length) throw new AppError('Order not found', 404);
  if (orders[0].status === 'refunded') throw new AppError('Order already refunded', 400);

  await pool.execute('UPDATE orders SET status = "refunded", notes = ?, updated_at = NOW() WHERE id = ?', [reason || 'Refund requested', id]);

  const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [id]);
  for (const item of items) {
    await pool.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
    await pool.execute(
      'UPDATE products SET status = CASE WHEN stock = 0 THEN "Out of Stock" WHEN stock <= 10 THEN "Low Stock" ELSE "In Stock" END WHERE id = ?',
      [item.product_id]
    );
  }

  res.json({ success: true, message: 'Order refunded and stock restored' });
});
