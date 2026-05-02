import {AuditActionType, RaffleStatus} from '@prisma/client';
import {prisma} from '../../lib/prisma.js';
import {assertStatusTransition, validateRaffleInput, validateRaffleProductInput, writeAuditLog} from '../../lib/raffle-admin.js';
import {resolveCurrentShopId} from '../../lib/shop-context.js';

function esc(v: unknown): string { return String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
const statuses = Object.values(RaffleStatus);

export async function renderRafflesPage(shop: string): Promise<string> {
  const shopId = await resolveCurrentShopId(shop);
  const raffles = await prisma.raffle.findMany({where: {shopId}, orderBy: {createdAt: 'desc'}});
  const rows = raffles.map((r) => `<tr><td>${esc(r.title)}</td><td>${esc(r.slug)}</td><td>${r.status}</td><td>${r.soldTicketsCount}</td><td>${r.remainingTicketsCount ?? Math.max(r.maxTickets - r.soldTicketsCount, 0)}</td><td>${r.createdAt.toISOString()}</td><td>${r.updatedAt.toISOString()}</td><td><a href="/admin/raffles/${r.id}?shop=${encodeURIComponent(shop)}">Edit</a></td></tr>`).join('');
  return `<!doctype html><html><body><h1>Raffles</h1><a href="/admin/raffles/new?shop=${encodeURIComponent(shop)}">Create raffle</a><table border="1"><tr><th>Title</th><th>Slug</th><th>Status</th><th>Sold</th><th>Remaining</th><th>Created</th><th>Updated</th><th>Actions</th></tr>${rows}</table></body></html>`;
}

export function raffleForm(action: string, shop: string, errors: string[], values: any = {}): string {
  const options = statuses.map((s) => `<option value="${s}" ${values.status === s ? 'selected' : ''}>${s}</option>`).join('');
  return `<!doctype html><html><body><h1>Raffle form</h1>${errors.map((e) => `<p style="color:red">${esc(e)}</p>`).join('')}<form method="post" action="${action}?shop=${encodeURIComponent(shop)}"><input name="title" placeholder="title" value="${esc(values.title)}"/><input name="slug" placeholder="slug" value="${esc(values.slug)}"/><textarea name="description">${esc(values.description)}</textarea><select name="status">${options}</select><input type="datetime-local" name="startDate" value="${esc(values.startDate)}"/><input type="datetime-local" name="endDate" value="${esc(values.endDate)}"/><input type="number" name="maxTickets" value="${esc(values.maxTickets ?? 1)}"/><label><input type="checkbox" name="freeEntryEnabled" ${values.freeEntryEnabled ? 'checked' : ''}/>freeEntryEnabled</label><button type="submit">Save</button></form></body></html>`;
}

export async function createRaffle(shop: string, body: any) {
  const shopId = await resolveCurrentShopId(shop);
  const payload = {title: String(body.title ?? ''), slug: String(body.slug ?? ''), description: String(body.description ?? ''), status: (body.status ?? 'DRAFT') as RaffleStatus, startDate: body.startDate ? new Date(body.startDate) : undefined, endDate: body.endDate ? new Date(body.endDate) : undefined, maxTickets: Number(body.maxTickets), freeEntryEnabled: body.freeEntryEnabled === 'on'};
  const errors = validateRaffleInput(payload);
  if (errors.length) return {errors};
  const raffle = await prisma.$transaction(async (tx) => {
    const created = await tx.raffle.create({data: {...payload, shopId}});
    await writeAuditLog(tx, shopId, AuditActionType.CREATE, 'Raffle', created.id, {title: created.title, slug: created.slug, status: created.status});
    return created;
  });
  return {raffle};
}

export async function updateRaffle(shop: string, raffleId: string, body: any) {
  const shopId = await resolveCurrentShopId(shop);
  const existing = await prisma.raffle.findFirstOrThrow({where: {id: raffleId, shopId}});
  const payload = {title: String(body.title ?? ''), slug: String(body.slug ?? ''), description: String(body.description ?? ''), status: (body.status ?? existing.status) as RaffleStatus, startDate: body.startDate ? new Date(body.startDate) : undefined, endDate: body.endDate ? new Date(body.endDate) : undefined, maxTickets: Number(body.maxTickets), freeEntryEnabled: body.freeEntryEnabled === 'on'};
  const errors = validateRaffleInput(payload);
  if (errors.length) return {errors};
  assertStatusTransition(existing.status, payload.status);
  await prisma.$transaction(async (tx) => {
    const updated = await tx.raffle.update({where: {id: raffleId}, data: payload});
    await writeAuditLog(tx, shopId, AuditActionType.UPDATE, 'Raffle', updated.id, {title: updated.title, slug: updated.slug, status: updated.status});
  });
  return {ok: true};
}

export async function upsertRaffleProduct(shop: string, raffleId: string, body: any) {
  const shopId = await resolveCurrentShopId(shop);
  await prisma.raffle.findFirstOrThrow({where: {id: raffleId, shopId}});
  const payload = {shopifyProductId: String(body.shopifyProductId ?? ''), shopifyVariantId: body.shopifyVariantId ? String(body.shopifyVariantId) : undefined, title: body.title ? String(body.title) : undefined, variantTitle: body.variantTitle ? String(body.variantTitle) : undefined, ticketsPerUnit: Number(body.ticketsPerUnit), enabled: body.enabled !== 'false'};
  const errors = validateRaffleProductInput(payload);
  if (errors.length) return {errors};
  const product = await prisma.$transaction(async (tx) => {
    const upserted = await tx.raffleProduct.upsert({
      where: {raffleId_shopifyProductId_shopifyVariantId: {raffleId, shopifyProductId: payload.shopifyProductId, shopifyVariantId: payload.shopifyVariantId ?? null}},
      update: payload,
      create: {raffleId, ...payload},
    });
    await writeAuditLog(tx, shopId, upserted.enabled ? AuditActionType.UPDATE : AuditActionType.DELETE, 'RaffleProduct', upserted.id, payload);
    return upserted;
  });
  return {product};
}
