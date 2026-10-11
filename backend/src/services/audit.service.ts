import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

interface AuditEntry {
  adminId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string;
}

export const auditService = {
  // Falha de auditoria é registrada em log, mas não derruba a operação principal.
  async record(entry: AuditEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          adminId: entry.adminId ?? null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          metadata: (entry.metadata ?? undefined) as never,
          ip: entry.ip,
        },
      });
    } catch (err) {
      logger.warn({ err, action: entry.action }, 'Falha ao gravar log de auditoria');
    }
  },
};
