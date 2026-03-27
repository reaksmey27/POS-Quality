const express = require('express');
const router = express.Router();
const customer = require('../controllers/customerController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware, ROLES } = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.get('/', customer.getAll);
router.get('/:id', customer.getById);
router.get('/:id/orders', customer.getOrderHistory);
router.post('/', customer.create);
router.put('/:id', customer.update);
router.delete('/:id', roleMiddleware(ROLES.ADMIN, ROLES.MANAGER), customer.delete);

module.exports = router;
