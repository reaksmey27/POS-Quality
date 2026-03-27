-- ============================================================
-- POS System - Full Database Schema
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS pos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pos_db;

-- ============================================================
-- 1. ROLES & USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('admin','manager','cashier') NOT NULL DEFAULT 'cashier',
  avatar      VARCHAR(500)  DEFAULT NULL,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  last_login  DATETIME      DEFAULT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
) ENGINE=InnoDB;

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80)   NOT NULL UNIQUE,
  description TEXT          DEFAULT NULL,
  color       VARCHAR(20)   NOT NULL DEFAULT '#004ac6',
  icon        VARCHAR(50)   NOT NULL DEFAULT 'Package',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(200)   NOT NULL,
  sku           VARCHAR(80)    NOT NULL UNIQUE,
  description   TEXT           DEFAULT NULL,
  price         DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  cost_price    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  stock         INT            NOT NULL DEFAULT 0,
  barcode       VARCHAR(100)   DEFAULT NULL,
  image         VARCHAR(500)   DEFAULT NULL,
  category_id   INT UNSIGNED   DEFAULT NULL,
  status        ENUM('In Stock','Low Stock','Out of Stock') NOT NULL DEFAULT 'Out of Stock',
  sales_volume  INT            NOT NULL DEFAULT 0,
  trend         ENUM('up','down','neutral') NOT NULL DEFAULT 'neutral',
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sku      (sku),
  INDEX idx_category (category_id),
  INDEX idx_status   (status),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 4. CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(100)   NOT NULL,
  email             VARCHAR(150)   DEFAULT NULL,
  phone             VARCHAR(30)    DEFAULT NULL,
  address           TEXT           DEFAULT NULL,
  notes             TEXT           DEFAULT NULL,
  total_orders      INT            NOT NULL DEFAULT 0,
  total_spent       DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  last_order_date   DATETIME       DEFAULT NULL,
  created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone)
) ENGINE=InnoDB;

-- ============================================================
-- 5. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id           INT UNSIGNED  DEFAULT NULL,
  customer_id       INT UNSIGNED  DEFAULT NULL,
  subtotal          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_code     VARCHAR(30)   DEFAULT NULL,
  discount_amount   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax               DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total             DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status            ENUM('pending','completed','refunded','cancelled') NOT NULL DEFAULT 'pending',
  notes             TEXT          DEFAULT NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user      (user_id),
  INDEX idx_customer  (customer_id),
  INDEX idx_status    (status),
  INDEX idx_created   (created_at),
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 6. ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  order_id      INT UNSIGNED  NOT NULL,
  product_id    INT UNSIGNED  DEFAULT NULL,
  product_name  VARCHAR(200)  NOT NULL,
  quantity      INT           NOT NULL DEFAULT 1,
  unit_price    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_price   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  INDEX idx_order   (order_id),
  INDEX idx_product (product_id),
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 7. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id              INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  order_id        INT UNSIGNED  NOT NULL UNIQUE,
  payment_method  ENUM('cash','card','split','qr') NOT NULL DEFAULT 'cash',
  amount          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_details JSON          DEFAULT NULL,
  status          ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'completed',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order  (order_id),
  INDEX idx_method (payment_method),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 8. STOCK MOVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  product_id  INT UNSIGNED  NOT NULL,
  user_id     INT UNSIGNED  DEFAULT NULL,
  type        ENUM('sale','restock','adjustment','return','initial','loss') NOT NULL,
  quantity    INT           NOT NULL,
  notes       TEXT          DEFAULT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product (product_id),
  INDEX idx_type    (type),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 9. ACTIVITY LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED DEFAULT NULL,
  type        ENUM('order','inventory','customer','auth','system') NOT NULL DEFAULT 'system',
  message     VARCHAR(500) NOT NULL,
  metadata    JSON         DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type    (type),
  INDEX idx_user    (user_id),
  INDEX idx_created (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Admin (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@posquality.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uoO6', 'admin'),
('Manager One', 'manager@posquality.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uoO6', 'manager'),
('Cashier Staff', 'cashier@posquality.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uoO6', 'cashier')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Categories
INSERT INTO categories (name, description, color, icon) VALUES
('Beverages',    'Hot and cold drinks',         '#004ac6', 'Coffee'),
('Bakery',       'Fresh baked goods',           '#943700', 'Croissant'),
('Food',         'Main meals and snacks',        '#15803d', 'Utensils'),
('Retail Goods', 'Packaged retail products',    '#7c3aed', 'Package'),
('Desserts',     'Cakes, pastries, and sweets', '#db2777', 'Cake')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Sample Products
INSERT INTO products (name, sku, description, price, cost_price, stock, category_id, status, sales_volume, trend) VALUES
('Iced Americano',    'BEV-001', 'Double shot espresso over ice',        4.50, 1.20, 85,  1, 'In Stock',   520, 'up'),
('Caramel Latte',     'BEV-002', 'Espresso with caramel & steamed milk', 5.25, 1.50, 72,  1, 'In Stock',   480, 'up'),
('Green Tea',         'BEV-003', 'Premium Japanese matcha',              4.00, 0.90, 60,  1, 'In Stock',   310, 'neutral'),
('Croissant',         'BAK-001', 'Buttery flaky French croissant',       3.50, 0.80, 45,  2, 'In Stock',   290, 'up'),
('Sourdough Slice',   'BAK-002', 'Toasted artisan sourdough',            2.75, 0.60, 8,   2, 'Low Stock',  180, 'down'),
('Club Sandwich',     'FOD-001', 'Triple-decker with turkey & bacon',    8.50, 2.50, 30,  3, 'In Stock',   150, 'up'),
('Caesar Salad',      'FOD-002', 'Classic Caesar with croutons',         7.25, 2.00, 25,  3, 'In Stock',   120, 'neutral'),
('Mineral Water',     'RET-001', 'Premium still mineral water 500ml',    1.50, 0.40, 200, 4, 'In Stock',   650, 'up'),
('Energy Drink',      'RET-002', 'Sparkling energy 250ml',               3.00, 0.85, 6,   4, 'Low Stock',  340, 'up'),
('Chocolate Cake',    'DES-001', 'Rich dark chocolate layer cake slice',  5.50, 1.80, 20,  5, 'In Stock',   410, 'up'),
('Cheesecake Slice',  'DES-002', 'New York style cheesecake',            5.00, 1.60, 15,  5, 'In Stock',   380, 'up'),
('Sparkling Water',   'BEV-004', 'Premium sparkling mineral water',      2.25, 0.60, 0,   1, 'Out of Stock', 95, 'down')
ON DUPLICATE KEY UPDATE stock=VALUES(stock);
