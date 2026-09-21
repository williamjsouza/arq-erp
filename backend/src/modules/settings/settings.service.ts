import { prisma } from '../../config/prisma.js';
import { createDatabaseBackup, listBackups } from '../../utils/backup.js';

export class SettingsService {
  async getSettings() {
    return prisma.systemSetting.findMany();
  }

  async updateSetting(chave: string, valor: string, descricao?: string) {
    return prisma.systemSetting.upsert({
      where: { chave },
      update: { valor, descricao },
      create: { chave, valor, descricao },
    });
  }

  async triggerBackup() {
    const fileName = createDatabaseBackup();
    return { fileName, message: 'Backup do SQLite efetuado com sucesso!' };
  }

  async getBackupsList() {
    return listBackups();
  }
}

export const settingsService = new SettingsService();
