import { prisma } from '../config/prisma';

export const adminRepository = {
  findByEmail(email: string) {
    return prisma.admin.findUnique({ where: { email } });
  },

  count() {
    return prisma.admin.count();
  },

  create(data: { name: string; email: string; passwordHash: string; role: 'OWNER' | 'ADMIN' | 'STAFF' }) {
    return prisma.admin.create({ data });
  },

  touchLogin(id: string) {
    return prisma.admin.update({ where: { id }, data: { lastLoginAt: new Date() } });
  },
};
