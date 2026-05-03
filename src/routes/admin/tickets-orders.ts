import {AuditLog, TicketStatus} from '@prisma/client';
import {getOrderDetailsForShop, getTicketDetailsForShop, listOrdersForShop, listTicketsForShop, type OrderListItemWithStats} from '../../lib/admin-ticket-orders.js';


type TicketListItem = {
  id: string;
  ticketNumber: number;
  status: string;
  source: string;
  customerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
  raffle: {title: string};
  order: {shopifyOrderId: string | null; shopifyOrderNumber: string | null} | null;
};

type OrderDetailTicket = {id: string; ticketNumber: number; status: string; customerEmail: string | null; createdAt: Date};
type OrderDetailLog = Pick<AuditLog, 'createdAt' | 'action' | 'entityType' | 'entityId'>;

function esc(v: unknown): string { return String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }

function pageNav(basePath: string, shop: string, page: number, pageSize: number, total: number, params: URLSearchParams): string {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const mk = (p: number) => { const q = new URLSearchParams(params); q.set('page', String(p)); q.set('shop', shop); return `${basePath}?${q.toString()}`; };
  return `<div><p>Page ${page}/${totalPages} (total ${total})</p>${page > 1 ? `<a href="${mk(page - 1)}">Prev</a>` : ''} ${page < totalPages ? `<a href="${mk(page + 1)}">Next</a>` : ''}</div>`;
}

export async function renderTicketsPage(shop: string, query: any): Promise<string> {
  const params = new URLSearchParams();
  if (query.raffleId) params.set('raffleId', String(query.raffleId));
  if (query.status) params.set('status', String(query.status));
  if (query.email) params.set('email', String(query.email));
  if (query.ticketNumber) params.set('ticketNumber', String(query.ticketNumber));
  const page = Number(query.page ?? 1);
  const data = await listTicketsForShop(shop, {raffleId: query.raffleId, status: query.status as TicketStatus, email: query.email, ticketNumber: query.ticketNumber ? Number(query.ticketNumber) : undefined, page});
  const rows = (data.items as TicketListItem[]).map((t: TicketListItem) => `<tr><td><a href="/admin/tickets/${t.id}?shop=${encodeURIComponent(shop)}">${t.ticketNumber}</a></td><td>${esc(t.raffle.title)}</td><td>${t.status}</td><td>${t.source}</td><td>${esc(t.customerEmail)}</td><td>${esc(t.order?.shopifyOrderNumber ?? '')}</td><td>${esc(t.order?.shopifyOrderId ?? '')}</td><td>${t.createdAt.toISOString()}</td><td>${t.updatedAt.toISOString()}</td></tr>`).join('');
  return `<!doctype html><html><body><h1>Admin Tickets (read only)</h1><form method="get" action="/admin/tickets"><input type="hidden" name="shop" value="${esc(shop)}"/><input name="raffleId" placeholder="raffleId" value="${esc(query.raffleId)}"/><input name="status" placeholder="status" value="${esc(query.status)}"/><input name="email" placeholder="email" value="${esc(query.email)}"/><input name="ticketNumber" placeholder="ticketNumber" value="${esc(query.ticketNumber)}"/><button type="submit">Filter</button></form><table border="1"><tr><th>ticketNumber</th><th>raffle title</th><th>status</th><th>source</th><th>customerEmail</th><th>order number</th><th>order id</th><th>createdAt</th><th>updatedAt</th></tr>${rows}</table>${pageNav('/admin/tickets', shop, data.page, data.pageSize, data.total, params)}<p><a href="/admin/orders?shop=${encodeURIComponent(shop)}">Go to orders</a></p></body></html>`;
}

export async function renderOrdersPage(shop: string, query: any): Promise<string> {
  const params = new URLSearchParams();
  if (query.email) params.set('email', String(query.email));
  if (query.shopifyOrderId) params.set('shopifyOrderId', String(query.shopifyOrderId));
  if (query.shopifyOrderNumber) params.set('shopifyOrderNumber', String(query.shopifyOrderNumber));
  const page = Number(query.page ?? 1);
  const data = await listOrdersForShop(shop, {email: query.email, shopifyOrderId: query.shopifyOrderId, shopifyOrderNumber: query.shopifyOrderNumber, page});
  const rows = data.items.map((o: OrderListItemWithStats) => `<tr><td><a href="/admin/orders/${o.id}?shop=${encodeURIComponent(shop)}">${esc(o.shopifyOrderId)}</a></td><td>${esc(o.shopifyOrderNumber)}</td><td>${esc(o.customerEmail)}</td><td>${esc(o.financialStatus)}</td><td>${esc(o.fulfillmentStatus)}</td><td>${esc(o.totalPrice)}</td><td>${esc(o.currency)}</td><td>${o.processedAt?.toISOString() ?? ''}</td><td>${o.ticketStats.total}</td><td>${o.ticketStats.valid}</td><td>${o.ticketStats.refundedOrCancelled}</td></tr>`).join('');
  return `<!doctype html><html><body><h1>Admin Orders (read only)</h1><form method="get" action="/admin/orders"><input type="hidden" name="shop" value="${esc(shop)}"/><input name="email" placeholder="email" value="${esc(query.email)}"/><input name="shopifyOrderId" placeholder="shopifyOrderId" value="${esc(query.shopifyOrderId)}"/><input name="shopifyOrderNumber" placeholder="shopifyOrderNumber" value="${esc(query.shopifyOrderNumber)}"/><button type="submit">Filter</button></form><table border="1"><tr><th>shopifyOrderId</th><th>shopifyOrderNumber</th><th>customerEmail</th><th>financialStatus</th><th>fulfillmentStatus</th><th>totalPrice</th><th>currency</th><th>processedAt</th><th>tickets total</th><th>tickets VALID</th><th>tickets REFUNDED/CANCELLED</th></tr>${rows}</table>${pageNav('/admin/orders', shop, data.page, data.pageSize, data.total, params)}</body></html>`;
}

export async function renderOrderDetailsPage(shop: string, id: string): Promise<string> {
  const details = await getOrderDetailsForShop(shop, id);
  if (!details) return '<!doctype html><html><body><h1>Order not found</h1></body></html>';
  const tRows = (details.order.tickets as OrderDetailTicket[]).map((t: OrderDetailTicket) => `<tr><td><a href="/admin/tickets/${t.id}?shop=${encodeURIComponent(shop)}">${t.ticketNumber}</a></td><td>${t.status}</td><td>${esc(t.customerEmail)}</td><td>${t.createdAt.toISOString()}</td></tr>`).join('');
  const logs = (details.logs as OrderDetailLog[]).map((l: OrderDetailLog) => `<li>${l.createdAt.toISOString()} - ${l.action} ${esc(l.entityType)} ${esc(l.entityId)}</li>`).join('');
  return `<!doctype html><html><body><h1>Order detail ${esc(details.order.shopifyOrderId)}</h1><p>Email: ${esc(details.order.customerEmail)}</p><p>Financial: ${esc(details.order.financialStatus)} / Fulfillment: ${esc(details.order.fulfillmentStatus)}</p><h2>Tickets</h2><table border="1"><tr><th>ticketNumber</th><th>status</th><th>customerEmail</th><th>createdAt</th></tr>${tRows}</table><h2>Audit logs</h2><ul>${logs}</ul><p><a href="/admin/orders?shop=${encodeURIComponent(shop)}">Back</a></p></body></html>`;
}

export async function renderTicketDetailsPage(shop: string, ticketId: string): Promise<string> {
  const ticket = await getTicketDetailsForShop(shop, ticketId);
  if (!ticket) return '<!doctype html><html><body><h1>Ticket not found</h1></body></html>';
  return `<!doctype html><html><body><h1>Ticket ${ticket.ticketNumber}</h1><p>Status: ${ticket.status}</p><p>Email: ${esc(ticket.customerEmail)}</p><p>Raffle: ${esc(ticket.raffle.title)}</p><p>Order: ${esc(ticket.order?.shopifyOrderId ?? '')}</p><p><a href="/admin/tickets?shop=${encodeURIComponent(shop)}">Back</a></p></body></html>`;
}
