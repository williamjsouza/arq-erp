import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class InventoryService {
  async listMovements(companyId: string, page = 1, limit = 20, productId?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };

    if (productId) {
      where.productId = productId;
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: { select: { id: true, nome: true, sku: true, unit: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      data: movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addMovement(params: {
    companyId: string;
    productId: string;
    tipo: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantidade: number;
    motivo?: string;
    documentoRef?: string;
    origem?: string;
    usuarioId?: string;
  }) {
    const { companyId, productId, tipo, quantidade, motivo, documentoRef, origem, usuarioId } = params;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.companyId !== companyId) {
      throw new AppError('Produto não encontrado', 404, 'NOT_FOUND');
    }

    const saldoAnterior = product.estoqueAtual;
    let saldoNovo = saldoAnterior;

    if (tipo === 'IN') {
      saldoNovo = saldoAnterior + quantidade;
    } else if (tipo === 'OUT') {
      if (saldoAnterior < quantidade) {
        throw new AppError(`Saldo insuficiente. Estoque atual: ${saldoAnterior}`, 400, 'INSUFFICIENT_STOCK');
      }
      saldoNovo = saldoAnterior - quantidade;
    } else if (tipo === 'ADJUSTMENT') {
      saldoNovo = quantidade; // No ajuste, a quantidade enviada é o novo saldo absoluto
    }

    // Transação para atualizar produto e gravar histórico Kardex
    const [updatedProduct, movement] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { estoqueAtual: saldoNovo },
      }),
      prisma.stockMovement.create({
        data: {
          companyId,
          productId,
          tipo,
          quantidade,
          saldoAnterior,
          saldoNovo,
          motivo,
          documentoRef,
          origem: origem || 'MANUAL',
          usuarioId,
        },
      }),
    ]);

    return { product: updatedProduct, movement };
  }

  async getLowStockProducts(companyId: string) {
    const products = await prisma.product.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
      },
      include: { category: true, unit: true },
    });

    return products.filter((p) => p.estoqueAtual <= p.estoqueMinimo);
  }
}

export const inventoryService = new InventoryService();
