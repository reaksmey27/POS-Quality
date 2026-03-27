# POS Quality — API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

---

## Authentication

### POST /auth/login
```json
{ "email": "admin@posquality.com", "password": "admin123" }
```
**Response:** `{ success, data: { user, token } }`

### POST /auth/register
```json
{ "name": "John", "email": "john@email.com", "password": "secret", "role": "cashier" }
```

### GET /auth/me 🔒
Returns current user profile.

---

## Products 🔒

| Method | Route                   | Role        | Description         |
|--------|-------------------------|-------------|---------------------|
| GET    | /products               | All         | List with filters   |
| GET    | /products/:id           | All         | Get one             |
| GET    | /products/sku/:sku      | All         | Find by SKU         |
| GET    | /products/low-stock     | All         | Low stock list      |
| POST   | /products               | Admin/Mgr   | Create              |
| PUT    | /products/:id           | Admin/Mgr   | Update              |
| PATCH  | /products/:id/stock     | Admin/Mgr   | Stock adjustment    |
| DELETE | /products/:id           | Admin only  | Delete              |

**Query params:** `?category=Beverages&search=coffee&status=In+Stock&sortBy=price&order=ASC&page=1&limit=50`

---

## Categories 🔒

| Method | Route            | Role       | Description |
|--------|------------------|------------|-------------|
| GET    | /categories      | All        | List all    |
| POST   | /categories      | Admin/Mgr  | Create      |
| PUT    | /categories/:id  | Admin/Mgr  | Update      |
| DELETE | /categories/:id  | Admin only | Delete      |

---

## Orders 🔒

| Method | Route              | Role       | Description        |
|--------|--------------------|------------|--------------------|
| GET    | /orders            | All        | List with filters  |
| GET    | /orders/today      | All        | Today's summary    |
| GET    | /orders/:id        | All        | Order + items      |
| POST   | /orders            | All        | Create order       |
| PATCH  | /orders/:id/status | Admin/Mgr  | Update status      |
| POST   | /orders/:id/refund | Admin/Mgr  | Refund + restock   |

**Create order body:**
```json
{
  "items": [{ "productId": 1, "name": "Latte", "price": 5.25, "quantity": 2 }],
  "subtotal": 10.50,
  "discount_amount": 0,
  "tax": 0.53,
  "total": 11.03,
  "payment_method": "cash",
  "payment_details": { "cashGiven": 20, "change": 8.97 }
}
```

---

## Customers 🔒

| Method | Route                | Role       | Description     |
|--------|----------------------|------------|-----------------|
| GET    | /customers           | All        | List            |
| GET    | /customers/:id       | All        | Get one         |
| GET    | /customers/:id/orders| All        | Order history   |
| POST   | /customers           | All        | Add             |
| PUT    | /customers/:id       | All        | Update          |
| DELETE | /customers/:id       | Admin/Mgr  | Delete          |

---

## Reports 🔒

| Method | Route                  | Role       | Description          |
|--------|------------------------|------------|----------------------|
| GET    | /reports/sales         | All        | Summary (period)     |
| GET    | /reports/sales/range   | All        | Date range breakdown |
| GET    | /reports/sales/hourly  | All        | Hourly breakdown     |
| GET    | /reports/products/top  | All        | Top N products       |
| GET    | /reports/categories    | All        | Category revenue     |
| GET    | /reports/stock/alerts  | All        | Low stock            |
| GET    | /reports/customers     | Admin/Mgr  | Customer stats       |

**Query params (sales):** `?period=today|week|month|year`

---

## Payments 🔒

| Method | Route            | Description         |
|--------|------------------|---------------------|
| GET    | /payments        | List all            |
| GET    | /payments/:id    | Get one             |
| GET    | /payments/summary| Today by method     |

---

## Error Responses

```json
{ "success": false, "message": "Error description" }
```

| Code | Meaning              |
|------|----------------------|
| 400  | Bad request          |
| 401  | Unauthorized         |
| 403  | Forbidden (role)     |
| 404  | Not found            |
| 409  | Conflict (duplicate) |
| 429  | Rate limit exceeded  |
| 500  | Server error         |
