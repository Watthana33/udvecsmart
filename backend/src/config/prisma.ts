import { PrismaClient } from '@prisma/client';

// ใช้ Singleton pattern เพื่อป้องกัน Prisma Client instance งอกซ้ำซ้อนใน Development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const rawDbUrl = process.env.DATABASE_URL;
const resolvedUrl = (process.platform === 'win32' && rawDbUrl && rawDbUrl.includes('@postgres:5432'))
  ? rawDbUrl.replace('@postgres:5432', '@localhost:5432')
  : rawDbUrl;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: resolvedUrl ? { db: { url: resolvedUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
