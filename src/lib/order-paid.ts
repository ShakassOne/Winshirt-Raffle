import {AuditActionType, Prisma, RaffleStatus, TicketSource, TicketStatus} from '@prisma/client';
import {prisma} from './prisma.js';
import {writeAuditLog} from './raffle-admin.js';

type LineItem = {
  productId: string;
  variantId: string | null;
  title: string | null;
  variantTitle: string | null;
  quantity: number;
};

type ParsedOrder = {
  shopifyOrderId: string;
  shopifyOrderNumber: string | null;
  customerId: string | null;
  customerEmail: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: Prisma.Decimal | null;
  currency: string | null;
  processedAt: Date | null;
  lineItems: LineItem[];
};

export type HandleOrderPaidResult = 'created' | 'skipped_duplicate' | 'no_matching_products' | 'raffle_full_or_capacity_exceeded' | 'invalid_payload';

type PrismaTx = Prisma.TransactionClient;
type DbClient = typeof prisma;

function parseLineItem(line: Record<string, unknown>): LineItem | null {
  const quantity = Number(line.quantity ?? 0);
  const productId = line.product_id ? String(line.product_id) : '';
  if (!productId || !Number.isInteger(quantity) || quantity <= 0) return null;
  return {
    productId,
    variantId: line.variant_id ? String(line.variant_id) : null,
    title: line.title ? String(line.title) : null,
    variantTitle: line.variant_title ? String(line.variant_title) : null,
    quantity,
  };
}

export function parseOrderPaidPayload(payload: unknown): ParsedOrder | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  if (!p.id) return null;
  const lineItems = Array.isArray(p.line_items) ? p.line_items.map((item) => parseLineItem(item as Record<string, unknown>)).filter((x): x is LineItem => Boolean(x)) : [];
  if (lineItems.length === 0) return null;
  return {
    shopifyOrderId: String(p.id),
    shopifyOrderNumber: p.name ? String(p.name) : (p.order_number ? String(p.order_number) : null),
    customerId: p.customer && typeof p.customer === 'object' && (p.customer as Record<string, unknown>).id ? String((p.customer as Record<string, unknown>).id) : null,
    customerEmail: p.email ? String(p.email) : null,
    financialStatus: p.financial_status ? String(p.financial_status) : null,
    fulfillmentStatus: p.fulfillment_status ? String(p.fulfillment_status) : null,
    totalPrice: p.total_price ? new Prisma.Decimal(String(p.total_price)) : null,
    currency: p.currency ? String(p.currency) : null,
    processedAt: p.processed_at ? new Date(String(p.processed_at)) : null,
    lineItems,
  };
}

export async function handleOrderPaid(shopDomain: string, payload: unknown, db: DbClient = prisma): Promise<HandleOrderPaidResult> {
  const parsed = parseOrderPaidPayload(payload);
  if (!parsed) return 'invalid_payload';

  const shop = await db.shop.findUnique({where: {shopDomain}});
  if (!shop) return 'invalid_payload';

  return db.$transaction(async (tx) => {
    const existing = await tx.shopifyOrder.findUnique({where: {shopifyOrderId: parsed.shopifyOrderId}});
    if (existing) {
      await writeAuditLog(tx, shop.id, AuditActionType.IMPORT, 'ShopifyOrder', existing.id, {shopifyOrderId: parsed.shopifyOrderId, raffleIds: [], ticketsCreated: 0, reason: 'duplicate'});
      return 'skipped_duplicate' as const;
    }

    const order = await tx.shopifyOrder.create({
      data: {shopId: shop.id, ...parsed}
    });

    const products = await tx.raffleProduct.findMany({
      where: {
        enabled: true,
        OR: parsed.lineItems.map((li) => ({shopifyProductId: li.productId})),
        raffle: {shopId: shop.id, status: RaffleStatus.ACTIVE, drawLockedAt: null, drawnAt: null}
      },
      include: {raffle: true}
    });

    const raffleById = new Map<string, {raffleId: string; ticketsRequested: number}>();
    for (const li of parsed.lineItems) {
      const matches = products.filter((p) => p.shopifyProductId === li.productId && (!p.shopifyVariantId || p.shopifyVariantId === li.variantId));
      for (const match of matches) {
        const current = raffleById.get(match.raffleId) ?? {raffleId: match.raffleId, ticketsRequested: 0};
        current.ticketsRequested += li.quantity * match.ticketsPerUnit;
        raffleById.set(match.raffleId, current);
      }
    }

    if (raffleById.size === 0) {
      await writeAuditLog(tx, shop.id, AuditActionType.IMPORT, 'ShopifyOrder', order.id, {shopifyOrderId: parsed.shopifyOrderId, raffleIds: [], ticketsCreated: 0, reason: 'no_matching_products'});
      return 'no_matching_products' as const;
    }

    const ticketsData: Prisma.TicketCreateManyInput[] = [];
    const raffleIds = [...raffleById.keys()];

    for (const raffleId of raffleIds) {
      const raffle = await tx.raffle.findUnique({where: {id: raffleId}});
      if (!raffle) continue;
      const requested = raffleById.get(raffleId)!.ticketsRequested;
      if (raffle.soldTicketsCount + requested > raffle.maxTickets) {
        await writeAuditLog(tx, shop.id, AuditActionType.IMPORT, 'ShopifyOrder', order.id, {shopifyOrderId: parsed.shopifyOrderId, raffleIds: [raffleId], ticketsCreated: 0, reason: 'capacity_exceeded'});
        return 'raffle_full_or_capacity_exceeded' as const;
      }

      const agg = await tx.ticket.aggregate({_max: {ticketNumber: true}, where: {raffleId}});
      let nextTicketNumber = (agg._max.ticketNumber ?? 0) + 1;
      for (let i = 0; i < requested; i += 1) {
        ticketsData.push({
          raffleId,
          orderId: order.id,
          customerId: parsed.customerId,
          customerEmail: parsed.customerEmail,
          ticketNumber: nextTicketNumber,
          status: TicketStatus.VALID,
          source: TicketSource.PURCHASE,
        });
        nextTicketNumber += 1;
      }

      await tx.raffle.update({
        where: {id: raffleId},
        data: {
          soldTicketsCount: raffle.soldTicketsCount + requested,
          remainingTicketsCount: raffle.remainingTicketsCount == null ? null : Math.max(raffle.remainingTicketsCount - requested, 0)
        }
      });
    }

    if (ticketsData.length === 0) return 'no_matching_products' as const;
    await tx.ticket.createMany({data: ticketsData});

    await writeAuditLog(tx, shop.id, AuditActionType.IMPORT, 'ShopifyOrder', order.id, {shopifyOrderId: parsed.shopifyOrderId, raffleIds, ticketsCreated: ticketsData.length});
    return 'created' as const;
  });
}
