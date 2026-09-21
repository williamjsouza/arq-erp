import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { productsController } from './products.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requirePermission } from '../../middlewares/rbacMiddleware.js';
import { auditMiddleware } from '../../middlewares/auditMiddleware.js';

const uploadDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `prod-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'));
    }
  },
});

const router = Router();

router.use(authMiddleware);

router.post('/upload-image', requirePermission('products.create'), upload.single('image'), (req, res, next) => productsController.uploadImage(req, res, next));
router.get('/categories', requirePermission('products.view'), (req, res, next) => productsController.categories(req, res, next));
router.post('/categories', requirePermission('products.create'), (req, res, next) => productsController.storeCategory(req, res, next));
router.get('/brands', requirePermission('products.view'), (req, res, next) => productsController.brands(req, res, next));
router.get('/units', requirePermission('products.view'), (req, res, next) => productsController.units(req, res, next));

router.get('/', requirePermission('products.view'), (req, res, next) => productsController.index(req, res, next));
router.get('/:id', requirePermission('products.view'), (req, res, next) => productsController.show(req, res, next));
router.post('/', requirePermission('products.create'), auditMiddleware('PRODUTOS', 'CRIAR'), (req, res, next) => productsController.store(req, res, next));
router.put('/:id', requirePermission('products.edit'), auditMiddleware('PRODUTOS', 'EDITAR'), (req, res, next) => productsController.update(req, res, next));
router.delete('/:id', requirePermission('products.delete'), auditMiddleware('PRODUTOS', 'EXCLUIR'), (req, res, next) => productsController.destroy(req, res, next));

export default router;
