import {AuditActionType, Prisma, TicketStatus} from '@prisma/client';
import {prisma} from './prisma.js';
import {writeAuditLog} from './raffle-admin.js';

type DbClient = typeof prisma;
type Tx = Prisma.TransactionClient;

export type InvalidationReason = 'order_cancelled' | 'refund_total';

export async function recalculateRaffleCounters(tx: Tx, raffleIds: string[]): Promise<void> {
  for (const raffleId of raffleIds) {
    const validCount = await tx.ticket.count({where: {raffleId, status: TicketStatus.VALID}});
    const raffle = await tx.raffle.findUnique({where: {id: raffleId}});
    if (!raffle) continue;
    await tx.raffle.update({
      where: {id: raffleId},
      data: {
        soldTicketsCount: validCount,
        remainingTicketsCount: raffle.remainingTicketsCount == null ? null : Math.max(raffle.maxTickets - validCount, 0),
      },
    });
  }
}

export async function invalidateValidTicketsByOrder(
  shopDomain: string,
  shopifyOrderId: string,
  toStatus: TicketStatus.CANCELLED | TicketStatus.REFUNDED,
  auditReason: InvalidationReason,
  successAuditReason: 'order_cancelled_processed' | 'refund_processed',
  db: DbClient = prisma,
): Promise<'processed' | 'no_valid_tickets' | 'order_not_found'> {
  const shop = await db.shop.findUnique({where: {shopDomain}});
  if (!shop) return 'order_not_found';

  return db.$transaction(async (tx) => {
    const order = await tx.shopifyOrder.findFirst({where: {shopId: shop.id, shopifyOrderId}});
    if (!order) {
      await writeAuditLog(tx, shop.id, AuditActionType.UPDATE, 'ShopifyOrder', 'unknown', {shopifyOrderId, reason: 'order_not_found'});
      return 'order_not_found' as const;
    }

    const validTickets = await tx.ticket.findMany({where: {orderId: order.id, status: TicketStatus.VALID}});
    if (validTickets.length === 0) {
      await writeAuditLog(tx, shop.id, AuditActionType.UPDATE, 'ShopifyOrder', order.id, {shopifyOrderId, reason: 'duplicate_no_valid_tickets'});
      return 'no_valid_tickets' as const;
    }

    const ticketIds = validTickets.map((t) => t.id);
    await tx.ticket.updateMany({where: {id: {in: ticketIds}}, data: {status: toStatus}});

    const raffleIds = [...new Set(validTickets.map((t) => t.raffleId))];
    await recalculateRaffleCounters(tx, raffleIds);

    await writeAuditLog(tx, shop.id, AuditActionType.UPDATE, 'ShopifyOrder', order.id, {
      shopifyOrderId,
      reason: successAuditReason,
      invalidationReason: auditReason,
      raffleIds,
      ticketsCancelled: toStatus === TicketStatus.CANCELLED ? validTickets.length : 0,
      ticketsRefunded: toStatus === TicketStatus.REFUNDED ? validTickets.length : 0,
    });

    return 'processed' as const;
  });
}
