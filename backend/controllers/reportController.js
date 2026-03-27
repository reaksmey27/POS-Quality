const { pool } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');

exports.getSalesSummary = asyncHandler(async (req, res) => {
  const { period = 'today' } = req.query;

  const dateFilter = {
    today: 'DATE(created_at) = CURDATE()',
    week: 'created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)',
    month: 'MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())',
    year: 'YEAR(created_at) = YEAR(CURDATE())',
  }[period] || 'DATE(created_at) = CURDATE()';

  const [summary] = await pool.execute(`
    SELECT
      COUNT(*) AS total_orders,
      COALESCE(SUM(total), 0) AS total_revenue,
      COALESCE(AVG(total), 0) AS avg_order_value,
      COALESCE(SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END), 0) AS completed_orders,
      COALESCE(SUM(CASE WHEN status='refunded' THEN 1 ELSE 0 END), 0) AS refunded_orders
    FROM orders WHERE ${dateFilter}
  `);

  const [prevSummary] = await pool.execute(`
    SELECT COALESCE(SUM(total), 0) AS prev_revenue
    FROM orders WHERE ${period === 'today' 
      ? 'DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)'
      : period === 'week' 
      ? 'created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
      : 'MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))'}
  `);

  const prevRevenue = prevSummary[0].prev_revenue || 0;
  const currentRevenue = summary[0].total_revenue || 0;
  const growth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;

  res.json({ success: true, data: { ...summary[0], growth_percentage: parseFloat(growth) } });
});

exports.getSalesByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const [rows] = await pool.execute(`
    SELECT DATE(created_at) AS date, COUNT(*) AS orders, SUM(total) AS revenue, AVG(total) AS avg_value
    FROM orders
    WHERE DATE(created_at) BETWEEN ? AND ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [startDate, endDate]);
  res.json({ success: true, data: rows });
});

exports.getTopProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const [rows] = await pool.execute(`
    SELECT p.id, p.name, p.image, p.price, p.category_id,
      COALESCE(SUM(oi.quantity), 0) AS units_sold,
      COALESCE(SUM(oi.total_price), 0) AS revenue
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
    GROUP BY p.id
    ORDER BY units_sold DESC
    LIMIT ?
  `, [limit]);
  res.json({ success: true, data: rows });
});

exports.getCategoryPerformance = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT c.id, c.name, c.color,
      COUNT(DISTINCT p.id) AS product_count,
      COALESCE(SUM(oi.quantity), 0) AS units_sold,
      COALESCE(SUM(oi.total_price), 0) AS revenue
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
    GROUP BY c.id
    ORDER BY revenue DESC
  `);
  res.json({ success: true, data: rows });
});

exports.getLowStockAlerts = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;
  const [rows] = await pool.execute(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.stock <= ?
    ORDER BY p.stock ASC
  `, [threshold]);
  res.json({ success: true, data: rows });
});

exports.getHourlySales = asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const [rows] = await pool.execute(`
    SELECT HOUR(created_at) AS hour, COUNT(*) AS orders, SUM(total) AS revenue
    FROM orders
    WHERE DATE(created_at) = ? AND status = 'completed'
    GROUP BY HOUR(created_at)
    ORDER BY hour ASC
  `, [date]);
  res.json({ success: true, data: rows });
});

exports.getCustomerStats = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT
      COUNT(*) AS total_customers,
      SUM(total_orders) AS total_orders,
      COALESCE(AVG(total_spent), 0) AS avg_lifetime_value,
      COUNT(CASE WHEN last_order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) AS active_customers
    FROM customers
  `);
  res.json({ success: true, data: rows[0] });
});
