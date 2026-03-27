const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'cashier' } = req.body;

  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) throw new AppError('Email already registered', 409);

  const hashedPassword = await bcrypt.hash(password, 12);
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hashedPassword, role]
  );

  const [users] = await pool.execute('SELECT id, name, email, role FROM users WHERE id = ?', [result.insertId]);
  const user = users[0];
  const token = generateToken(user);

  res.status(201).json({ success: true, data: { user, token } });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.execute(
    'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
    [email]
  );

  if (!rows.length) throw new AppError('Invalid email or password', 401);
  const user = rows[0];

  if (!user.is_active) throw new AppError('Account is deactivated', 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const token = generateToken(user);
  const { password: _, ...userData } = user;

  await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

  res.json({ success: true, data: { user: userData, token } });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, created_at, last_login FROM users WHERE id = ?',
    [req.user.id]
  );
  res.json({ success: true, data: rows[0] });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;

  if (newPassword) {
    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);
    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
  }

  if (name) {
    await pool.execute('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
  }

  res.json({ success: true, message: 'Profile updated successfully' });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
  );
  res.json({ success: true, data: rows });
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const validRoles = ['admin', 'manager', 'cashier'];
  if (!validRoles.includes(role)) throw new AppError('Invalid role', 400);
  await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  res.json({ success: true, message: 'User role updated' });
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.execute('UPDATE users SET is_active = NOT is_active WHERE id = ?', [id]);
  res.json({ success: true, message: 'User status toggled' });
});
