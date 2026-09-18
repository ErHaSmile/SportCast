import { prisma } from "./prisma";

export async function writeOperationLog(params: {
  action: string;
  targetType: string;
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
  operator: string;
}) {
  await prisma.operationLog.create({
    data: {
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      before: params.before == null ? null : JSON.stringify(params.before),
      after: params.after == null ? null : JSON.stringify(params.after),
      operator: params.operator,
    },
  });
}
