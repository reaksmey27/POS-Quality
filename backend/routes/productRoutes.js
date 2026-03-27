const express = require('express');
const router = express.Router();
const product = require('../controllers/productController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware, ROLES } = require('../middleware/roleMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `product-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMiddleware);
router.get('/', product.getAll);
router.get('/low-stock', product.getLowStock);
router.get('/sku/:sku', product.getBySku);
router.get('/:id', product.getById);
router.post('/', roleMiddleware(ROLES.ADMIN, ROLES.MANAGER), upload.single('image'), product.create);
router.put('/:id', roleMiddleware(ROLES.ADMIN, ROLES.MANAGER), upload.single('image'), product.update);
router.patch('/:id/stock', roleMiddleware(ROLES.ADMIN, ROLES.MANAGER), product.updateStock);
router.delete('/:id', roleMiddleware(ROLES.ADMIN), product.delete);

module.exports = router;
