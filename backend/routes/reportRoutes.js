const express = require('express');
const router = express.Router();
const report = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware, ROLES } = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.get('/sales', report.getSalesSummary);
router.get('/sales/range', report.getSalesByDateRange);
router.get('/sales/hourly', report.getHourlySales);
router.get('/products/top', report.getTopProducts);
router.get('/categories', report.getCategoryPerformance);
router.get('/stock/alerts', report.getLowStockAlerts);
router.get('/customers', roleMiddleware(ROLES.ADMIN, ROLES.MANAGER), report.getCustomerStats);

module.exports = router;
