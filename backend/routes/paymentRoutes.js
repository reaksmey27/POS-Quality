const express = require('express');
const router = express.Router();
const payment = require('../controllers/paymentController');
const report = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/', payment.getAll);
router.get('/summary', payment.getMethodSummary);
router.get('/:id', payment.getById);

module.exports = router;
