import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { productsService } from './products.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';

const productSchema = z.object({
  codigo: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  codigoBarras: z.string().optional().nullable(),
  nome: z.string().min(2, 'Nome do produto é obrigatório'),
  descricao: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  precoCusto: z.number().min(0).default(0),
  precoVenda: z.number().min(0).default(0),
  estoqueMinimo: z.number().min(0).default(0),
  estoqueMaximo: z.number().min(0).default(1000),
  imagemUrl: z.string().optional().nullable(),
  fabricante: z.string().optional().nullable(),
  linkFornecedor: z.string().optional().nullable(),
  peso: z.number().optional().nullable(),
  dimensoes: z.string().optional().nullable(),
  garantiaMeses: z.number().optional().nullable(),
  localizacaoEstoque: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export class ProductsController {
  async index(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const categoryId = req.query.categoryId as string;

      const result = await productsService.listProducts(req.user!.companyId, page, limit, search, categoryId);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await productsService.getProduct(id, req.user!.companyId);
      return res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = productSchema.parse(req.body);
      const product = await productsService.createProduct(req.user!.companyId, data);
      return res.status(201).json({ success: true, data: product, message: 'Produto cadastrado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await productsService.updateProduct(id, req.user!.companyId, req.body);
      return res.json({ success: true, data: product, message: 'Produto atualizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await productsService.deleteProduct(id, req.user!.companyId);
      return res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  async categories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categories = await productsService.listCategories();
      return res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  async storeCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { nome, descricao } = req.body;
      const category = await productsService.createCategory(nome, descricao);
      return res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async brands(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const brands = await productsService.listBrands();
      return res.json({ success: true, data: brands });
    } catch (error) {
      next(error);
    }
  }

  async units(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const units = await productsService.listUnits();
      return res.json({ success: true, data: units });
    } catch (error) {
      next(error);
    }
  }

  async uploadImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhuma imagem enviada' });
      }
      const fileUrl = `/uploads/products/${req.file.filename}`;
      return res.json({
        success: true,
        imageUrl: fileUrl,
        message: 'Upload de imagem concluído com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
