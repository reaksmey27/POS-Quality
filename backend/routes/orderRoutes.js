const express = require('express');
const router = express.Router();
const order = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware, ROLES } = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.get('/', order.getAll);
router.get('/today', order.getTodaySummary);
router.get('/:id', order.getById);
router.post('/', order.create);
router.patch('/:id/status', roleMiddleware(ROLES.ADMIN, ROLES.MANAGER), order.updateStatus);
router.post('/:id/refund', roleMiddleware(ROLES.ADMIN, ROLES.MANAGER), order.refundOrder);

module.exports = router;
