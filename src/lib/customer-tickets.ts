import {TicketStatus} from '@prisma/client';
import {prisma} from './prisma.js';

export type CustomerTicketView = {
  raffleTitle: string;
  ticketNumber: number;
  status: TicketStatus;
  source: string;
  orderReference: string;
  createdAt: Date;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeOrderReference(value: string): string {
  return value.trim();
}

export async function findCustomerTicketsByOrder(
  shopDomain: string,
  email: string,
  orderReference: string,
  db: any = prisma,
): Promise<CustomerTicketView[]> {
  const normalizedEmail = normalizeEmail(email);
  const normalizedReference = normalizeOrderReference(orderReference);

  if (!normalizedEmail || !normalizedReference) {
    return [];
  }

  const shop = await db.shop.findUnique({where: {shopDomain}, select: {id: true}});
  if (!shop) return [];

  const order = await db.shopifyOrder.findFirst({
    where: {
      shopId: shop.id,
      customerEmail: normalizedEmail,
      OR: [{shopifyOrderId: normalizedReference}, {shopifyOrderNumber: normalizedReference}],
    },
    select: {id: true, shopifyOrderId: true, shopifyOrderNumber: true},
  });

  if (!order) return [];

  const tickets = await db.ticket.findMany({
    where: {orderId: order.id, raffle: {shopId: shop.id}},
    select: {
      ticketNumber: true,
      status: true,
      source: true,
      createdAt: true,
      raffle: {select: {title: true}},
      order: {select: {shopifyOrderId: true, shopifyOrderNumber: true}},
    },
    orderBy: [{createdAt: 'asc'}, {ticketNumber: 'asc'}],
  });

  return tickets.map((ticket: any) => ({
    raffleTitle: ticket.raffle.title,
    ticketNumber: ticket.ticketNumber,
    status: ticket.status,
    source: ticket.source,
    orderReference: ticket.order.shopifyOrderNumber ?? ticket.order.shopifyOrderId,
    createdAt: ticket.createdAt,
  }));
}
