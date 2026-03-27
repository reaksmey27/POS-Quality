const express = require('express');
const router = express.Router();
const category = require('../controllers/categoryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware, ROLES } = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.get('/', category.getAll);
router.post('/', roleMiddleware(ROLES.ADMIN, ROLES.MANAGER), category.create);
router.put('/:id', roleMiddleware(ROLES.ADMIN, ROLES.MANAGER), category.update);
router.delete('/:id', roleMiddleware(ROLES.ADMIN), category.delete);

module.exports = router;
