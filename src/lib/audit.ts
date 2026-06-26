import { prisma } from "@/lib/db";

export async function logAudit(params: {
  entityType: string;
  entityId: string;
  action: string;
  details?: string;
  userId: string;
}) {
  await prisma.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      details: params.details,
      userId: params.userId,
    },
  });
}

export async function logStatusChange(params: {
  orderItemId: string;
  fromStatus: string | null;
  toStatus: string;
  reason?: string;
  changedById: string;
}) {
  await prisma.statusHistory.create({
    data: {
      orderItemId: params.orderItemId,
      fromStatus: params.fromStatus as never,
      toStatus: params.toStatus as never,
      reason: params.reason,
      changedById: params.changedById,
    },
  });
}
