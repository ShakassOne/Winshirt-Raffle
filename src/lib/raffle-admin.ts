import {AuditActionType, Prisma, RaffleStatus} from '@prisma/client';

export type RaffleInput = {
  title: string;
  slug: string;
  description?: string;
  status: RaffleStatus;
  startDate?: Date;
  endDate?: Date;
  maxTickets: number;
  freeEntryEnabled: boolean;
};

export type RaffleProductInput = {
  shopifyProductId: string;
  shopifyVariantId?: string;
  title?: string;
  variantTitle?: string;
  ticketsPerUnit: number;
  enabled: boolean;
};

const slugRegex = /^[a-z0-9-]+$/;
const editableStatuses: Record<RaffleStatus, RaffleStatus[]> = {
  DRAFT: ['DRAFT', 'ACTIVE', 'CANCELLED'],
  ACTIVE: ['ACTIVE', 'PAUSED', 'ENDED', 'CANCELLED'],
  PAUSED: ['PAUSED', 'ACTIVE', 'ENDED', 'CANCELLED'],
  ENDED: ['ENDED', 'DRAWN'],
  DRAWN: ['DRAWN'],
  CANCELLED: ['CANCELLED'],
};

export function validateRaffleInput(input: RaffleInput): string[] {
  const errors: string[] = [];
  if (!input.title.trim()) errors.push('title is required');
  if (!input.slug.trim()) errors.push('slug is required');
  if (input.slug && !slugRegex.test(input.slug)) errors.push('slug must be lowercase alphanumeric with hyphens only');
  if (!Number.isInteger(input.maxTickets) || input.maxTickets <= 0) errors.push('maxTickets must be > 0');
  if (input.startDate && input.endDate && input.endDate <= input.startDate) errors.push('endDate must be after startDate');
  return errors;
}

export function validateRaffleProductInput(input: RaffleProductInput): string[] {
  const errors: string[] = [];
  if (!input.shopifyProductId.trim()) errors.push('shopifyProductId is required');
  if (!Number.isInteger(input.ticketsPerUnit) || input.ticketsPerUnit <= 0) errors.push('ticketsPerUnit must be > 0');
  return errors;
}

export function assertStatusTransition(current: RaffleStatus, next: RaffleStatus): void {
  if (!editableStatuses[current].includes(next)) throw new Error(`Invalid status transition: ${current} -> ${next}`);
}

export async function writeAuditLog(tx: Prisma.TransactionClient, shopId: string, action: AuditActionType, entityType: string, entityId: string, payloadJson: unknown) {
  await tx.auditLog.create({data: {shopId, action, entityType, entityId, payloadJson: payloadJson as Prisma.InputJsonValue}});
}
