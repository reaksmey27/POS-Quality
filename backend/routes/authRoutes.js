const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware, ROLES } = require('../middleware/roleMiddleware');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/me', authMiddleware, auth.getProfile);
router.put('/me', authMiddleware, auth.updateProfile);
router.get('/users', authMiddleware, roleMiddleware(ROLES.ADMIN), auth.getAllUsers);
router.patch('/users/:id/role', authMiddleware, roleMiddleware(ROLES.ADMIN), auth.updateUserRole);
router.patch('/users/:id/toggle', authMiddleware, roleMiddleware(ROLES.ADMIN), auth.toggleUserStatus);

module.exports = router;
