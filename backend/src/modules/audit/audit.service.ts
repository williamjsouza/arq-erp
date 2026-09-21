import { prisma } from '../../config/prisma.js';

export class AuditService {
  async listLogs(companyId: string, page = 1, limit = 20, modulo?: string, userName?: string) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };

    if (modulo) where.modulo = modulo;
    if (userName) where.userName = { contains: userName };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const auditService = new AuditService();
