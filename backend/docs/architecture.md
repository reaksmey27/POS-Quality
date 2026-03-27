# POS Quality — System Architecture

## Overview

This is a **full-stack POS system** with two deployment options:
1. **Firebase mode** — Frontend uses Firebase Auth + Firestore (ready out of the box)
2. **MySQL mode** — Frontend connects to the Node.js REST API + MySQL backend

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER CLIENT                     │
│                                                       │
│  ┌─────────────┐    ┌─────────────┐                  │
│  │  React App  │    │  Zustand    │                  │
│  │  (Vite)     │◄──►│  Stores     │                  │
│  └──────┬──────┘    └─────────────┘                  │
│         │                                             │
│  ┌──────▼──────────────────────────┐                 │
│  │          Service Layer           │                 │
│  │  ┌────────┐  ┌──────────────┐   │                 │
│  │  │Firebase│  │ REST API     │   │                 │
│  │  │Service │  │ (api.js)     │   │                 │
│  │  └────────┘  └──────────────┘   │                 │
│  └─────────────────────────────────┘                 │
└─────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────┐    ┌──────────────────────┐
│  Firebase   │    │  Node.js + Express   │
│  Firestore  │    │  (REST API :5000)    │
│  Auth       │    └──────────┬───────────┘
└─────────────┘               │
                    ┌──────────▼───────────┐
                    │    MySQL Database     │
                    │    (pos_db)          │
                    └──────────────────────┘
```

---

## Frontend Architecture

```
src/
├── context/          # React Context providers
│   ├── AuthContext   # Firebase auth state
│   └── ThemeContext  # Dark/light mode
│
├── store/            # Zustand global stores
│   ├── authStore     # User & role state
│   ├── cartStore     # Cart items, discounts, held orders
│   └── productStore  # Product list & filters
│
├── hooks/            # Custom React hooks
│   ├── useAuth       # Auth + permission helpers
│   ├── useCart       # Cart operations + toasts
│   └── useOfflineSync# Queue orders when offline
│
├── services/         # Data layer
│   ├── firestoreService  # Firebase Firestore CRUD
│   ├── api.js            # REST API base client
│   ├── productService    # Product REST endpoints
│   ├── orderService      # Order REST endpoints
│   ├── customerService   # Customer REST endpoints
│   └── reportService     # Report REST endpoints
│
├── components/
│   ├── ui/           # Atomic components
│   │   ├── Button    # Variant button with loading
│   │   ├── Input     # Labeled input with errors
│   │   ├── Card      # Surface card
│   │   └── Table     # Sortable data table
│   │
│   ├── pos/          # POS-specific components
│   │   ├── ProductCard   # Product tile with add-to-cart
│   │   ├── CartItem      # Cart row with +/- controls
│   │   ├── CartSummary   # Totals + checkout button
│   │   └── BarcodeScanner # Camera QR/barcode reader
│   │
│   ├── layout/       # App shell
│   │   ├── Sidebar   # Navigation sidebar
│   │   └── Header    # Top bar with search/notifications
│   │
│   └── modals/       # Modal dialogs
│       ├── CheckoutModal
│       ├── CustomerModal
│       ├── ProductModal
│       ├── OrderDetailsModal
│       └── ScannerModal
│
├── utils/            # Pure utility functions
│   ├── currency.js   # formatCurrency, calcTotal
│   ├── barcode.js    # generateSKU, validateBarcode
│   ├── formatDate.js # formatRelative, formatDateTime
│   └── localStorage.js # Type-safe storage wrappers
│
└── pages/            # Page-level components
    ├── Dashboard     # Stats + charts + activity
    ├── Menu (POS)    # Product grid + cart
    ├── Inventory     # Product CRUD table
    ├── Orders        # Order history
    ├── Customers     # Customer database
    ├── Reports       # Analytics charts
    └── Settings      # Configuration
```

---

## Backend Architecture

```
backend/
├── config/
│   ├── db.js         # MySQL connection pool
│   └── firebase.js   # Firebase Admin (optional)
│
├── middleware/
│   ├── authMiddleware   # JWT token verification
│   ├── roleMiddleware   # Role-based access control
│   └── errorMiddleware  # Global error handler + AppError
│
├── controllers/      # Request handlers (thin layer)
│   ├── authController
│   ├── productController
│   ├── categoryController
│   ├── customerController
│   ├── orderController
│   ├── paymentController
│   └── reportController
│
├── routes/           # Express routers
│   ├── authRoutes
│   ├── productRoutes   (+ Multer file upload)
│   ├── categoryRoutes
│   ├── customerRoutes
│   ├── orderRoutes
│   ├── paymentRoutes
│   └── reportRoutes
│
├── utils/
│   ├── barcodeGenerator.js
│   ├── receiptGenerator.js
│   ├── stockCalculator.js
│   └── formatDate.js
│
├── seeders/
│   ├── seedUsers.js
│   ├── seedCategories.js
│   ├── seedProducts.js
│   └── seedAll.js
│
├── uploads/          # Product images (auto-created)
├── app.js            # Express app setup
└── server.js         # Entry point
```

---

## Database ERD (Simplified)

```
users (id, name, email, password, role, is_active)
  │
  ├── orders (id, user_id→, customer_id→, total, status)
  │     ├── order_items (id, order_id→, product_id→, quantity, price)
  │     └── payments (id, order_id→, method, amount)
  │
  └── stock_movements (product_id→, user_id→, type, quantity)

categories (id, name, color, icon)
  └── products (id, category_id→, sku, price, stock, status)

customers (id, name, email, total_orders, total_spent)
  └── orders.customer_id →

activity_log (id, user_id→, type, message, metadata)
```

---

## Security Model

- **JWT tokens** — signed with `JWT_SECRET`, expire in 7 days
- **bcrypt** — passwords hashed with salt rounds 12
- **Helmet** — sets secure HTTP headers
- **Rate limiting** — 500 req/15min per IP
- **CORS** — allowlist-based origin validation
- **Role guards** — admin > manager > cashier hierarchy
- **Input validation** — express-validator on all routes
