import { prisma } from '../config/prisma';

interface CreateSessionData {
  adminId: string;
  tokenHash: string;
  csrfTokenHash: string;
  ip?: string;
  userAgent?: string;
  expiresAt: Date;
}

export const sessionRepository = {
  create(data: CreateSessionData) {
    return prisma.adminSession.create({ data });
  },

  findByTokenHash(tokenHash: string) {
    return prisma.adminSession.findUnique({
      where: { tokenHash },
      include: { admin: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
    });
  },

  touch(id: string) {
    return prisma.adminSession.update({ where: { id }, data: { lastUsedAt: new Date() } });
  },

  revoke(id: string) {
    return prisma.adminSession.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: new Date() } });
  },

  revokeAllForAdmin(adminId: string) {
    return prisma.adminSession.updateMany({ where: { adminId, revokedAt: null }, data: { revokedAt: new Date() } });
  },

  // Limpeza oportunista: remove sessões expiradas/revogadas há mais de 7 dias.
  deleteStale() {
    const limit = new Date(Date.now() - 7 * 24 * 3600_000);
    return prisma.adminSession.deleteMany({
      where: { OR: [{ expiresAt: { lt: limit } }, { revokedAt: { lt: limit } }] },
    });
  },
};
