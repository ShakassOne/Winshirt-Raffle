import {AuditLog, TicketStatus} from '@prisma/client';
import {prisma} from './prisma.js';
import {resolveCurrentShopId} from './shop-context.js';

export type TicketFilters = { raffleId?: string; status?: TicketStatus; email?: string; ticketNumber?: number; page?: number; pageSize?: number };
export type OrderFilters = { email?: string; shopifyOrderId?: string; shopifyOrderNumber?: string; page?: number; pageSize?: number };

type OrderTicketStatusRow = {status: TicketStatus};
export type OrderListItemWithStats = {
  id: string;
  shopifyOrderId: string;
  shopifyOrderNumber: string | null;
  customerEmail: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: unknown;
  currency: string | null;
  processedAt: Date | null;
  _count: {tickets: number};
  tickets: OrderTicketStatusRow[];
  ticketStats: {total: number; valid: number; refundedOrCancelled: number};
};

type OrderWithTicketStatsSource = Omit<OrderListItemWithStats, 'ticketStats'>;
type OrderTicketRef = {id: string};

function normalizePage(page?: number, pageSize?: number) {
  const take = Math.min(Math.max(pageSize ?? 25, 1), 100);
  const currentPage = Math.max(page ?? 1, 1);
  return {take, skip: (currentPage - 1) * take, page: currentPage};
}

export async function listTicketsForShop(shop: string, filters: TicketFilters = {}, db: any = prisma, resolveShopId: any = resolveCurrentShopId) {
  const shopId = await resolveShopId(shop);
  const paging = normalizePage(filters.page, filters.pageSize);
  const where: any = {
    raffle: {shopId},
    ...(filters.raffleId ? {raffleId: filters.raffleId} : {}),
    ...(filters.status ? {status: filters.status} : {}),
    ...(filters.email ? {customerEmail: {contains: filters.email, mode: 'insensitive'}} : {}),
    ...(typeof filters.ticketNumber === 'number' ? {ticketNumber: filters.ticketNumber} : {}),
  };

  const [items, total] = await Promise.all([
    db.ticket.findMany({where, include: {raffle: {select: {title: true}}, order: {select: {shopifyOrderId: true, shopifyOrderNumber: true}}}, orderBy: {createdAt: 'desc'}, skip: paging.skip, take: paging.take}),
    db.ticket.count({where})
  ]);

  return {items, total, page: paging.page, pageSize: paging.take};
}

export async function listOrdersForShop(shop: string, filters: OrderFilters = {}, db: any = prisma, resolveShopId: any = resolveCurrentShopId) {
  const shopId = await resolveShopId(shop);
  const paging = normalizePage(filters.page, filters.pageSize);
  const where: any = {
    shopId,
    ...(filters.email ? {customerEmail: {contains: filters.email, mode: 'insensitive'}} : {}),
    ...(filters.shopifyOrderId ? {shopifyOrderId: {contains: filters.shopifyOrderId}} : {}),
    ...(filters.shopifyOrderNumber ? {shopifyOrderNumber: {contains: filters.shopifyOrderNumber}} : {}),
  };

  const [items, total] = await Promise.all([
    db.shopifyOrder.findMany({
      where,
      select: {
        id: true,
        shopifyOrderId: true,
        shopifyOrderNumber: true,
        customerEmail: true,
        financialStatus: true,
        fulfillmentStatus: true,
        totalPrice: true,
        currency: true,
        processedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {select: {tickets: true}},
        tickets: {select: {status: true}},
      },
      orderBy: {createdAt: 'desc'},
      skip: paging.skip,
      take: paging.take,
    }),
    db.shopifyOrder.count({where}),
  ]);

  const mapped: OrderListItemWithStats[] = (items as OrderWithTicketStatsSource[]).map((o: OrderWithTicketStatsSource) => ({
    ...o,
    ticketStats: {
      total: o._count.tickets,
      valid: o.tickets.filter((t: OrderTicketStatusRow) => t.status === TicketStatus.VALID).length,
      refundedOrCancelled: o.tickets.filter((t: OrderTicketStatusRow) => t.status === TicketStatus.REFUNDED || t.status === TicketStatus.CANCELLED).length,
    },
  }));

  return {items: mapped, total, page: paging.page, pageSize: paging.take};
}

export async function getOrderDetailsForShop(shop: string, orderId: string, db: any = prisma, resolveShopId: any = resolveCurrentShopId) {
  const shopId = await resolveShopId(shop);
  const order = await db.shopifyOrder.findFirst({where: {id: orderId, shopId}, include: {tickets: {orderBy: {ticketNumber: 'asc'}}, shop: {select: {shopDomain: true}}}});
  if (!order) return null;

  const logs = await db.auditLog.findMany({where: {shopId, OR: [{entityType: 'ShopifyOrder', entityId: order.id}, {entityType: 'Ticket', entityId: {in: (order.tickets as OrderTicketRef[]).map((t: OrderTicketRef) => t.id)}}]}, orderBy: {createdAt: 'desc'}, take: 100});
  return {order, logs};
}

export async function getTicketDetailsForShop(shop: string, ticketId: string, db: any = prisma, resolveShopId: any = resolveCurrentShopId) {
  const shopId = await resolveShopId(shop);
  return db.ticket.findFirst({where: {id: ticketId, raffle: {shopId}}, include: {raffle: {select: {title: true}}, order: {select: {shopifyOrderId: true, shopifyOrderNumber: true}}}});
}
