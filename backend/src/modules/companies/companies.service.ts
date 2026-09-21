import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';

export class CompaniesService {
  async listCompanies() {
    return prisma.company.findMany({
      orderBy: { razaoSocial: 'asc' },
    });
  }

  async getCompany(id: string) {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new AppError('Empresa não encontrada', 404, 'NOT_FOUND');
    }
    return company;
  }

  async updateCompany(id: string, data: any) {
    const updateData: any = {};
    const allowedFields = [
      'razaoSocial',
      'nomeFantasia',
      'cnpj',
      'inscricaoEst',
      'email',
      'telefone',
      'cep',
      'endereco',
      'numero',
      'complemento',
      'bairro',
      'cidade',
      'estado',
      'status',
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    return prisma.company.update({
      where: { id },
      data: updateData,
    });
  }
}

export const companiesService = new CompaniesService();
