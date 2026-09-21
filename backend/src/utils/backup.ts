import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export function createDatabaseBackup(): string {
  const backupDir = path.resolve(env.BACKUP_DIR);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-sqlite-${timestamp}.db`;
  const backupPath = path.join(backupDir, backupFileName);

  // Localizar o arquivo SQLite atual
  const rawDb = env.DATABASE_URL.replace('file:', '').trim();
  const candidates = [
    path.resolve(process.cwd(), rawDb),
    path.resolve(process.cwd(), 'prisma', path.basename(rawDb)),
    path.resolve(process.cwd(), '../prisma', path.basename(rawDb)),
    path.resolve(process.cwd(), 'prisma/dev.db'),
    path.resolve(process.cwd(), '../prisma/dev.db'),
    path.resolve('c:/laragon/www/arq/prisma/dev.db'),
  ];

  const dbPath = candidates.find((p) => fs.existsSync(p));

  if (!dbPath) {
    throw new Error(`Arquivo de banco de dados não encontrado em nenhum dos locais pesquisados: ${candidates.join(', ')}`);
  }

  // Efetuar cópia do arquivo
  fs.copyFileSync(dbPath, backupPath);
  logger.info(`Backup do SQLite criado com sucesso: ${backupPath}`);

  return backupFileName;
}

export function listBackups(): Array<{ name: string; size: number; createdAt: Date }> {
  const backupDir = path.resolve(env.BACKUP_DIR);
  if (!fs.existsSync(backupDir)) {
    return [];
  }

  const files = fs.readdirSync(backupDir);
  return files
    .filter((f) => f.endsWith('.db'))
    .map((f) => {
      const filePath = path.join(backupDir, f);
      const stat = fs.statSync(filePath);
      return {
        name: f,
        size: stat.size,
        createdAt: stat.birthtime,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
