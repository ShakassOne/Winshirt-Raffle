import {TicketStatus} from '@prisma/client';
import {findCustomerTicketsByOrder} from '../../lib/customer-tickets.js';

function esc(v: unknown): string {
  return String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function statusMessage(status: TicketStatus): string {
  if (status === TicketStatus.CANCELLED) return 'Ticket annulé suite à une annulation de commande.';
  if (status === TicketStatus.REFUNDED) return 'Ticket remboursé et invalide pour le tirage.';
  return '';
}

export async function renderCustomerTicketsPage(shop: string, email = '', orderReference = '', hasSearched = false): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOrderReference = orderReference.trim();
  const canSearch = normalizedEmail.length > 0 && normalizedOrderReference.length > 0;
  const tickets = canSearch ? await findCustomerTicketsByOrder(shop, normalizedEmail, normalizedOrderReference) : [];

  const feedback = hasSearched && !canSearch
    ? '<p style="color:#b45309">Veuillez renseigner email + numéro de commande ou order id.</p>'
    : hasSearched && tickets.length === 0
      ? '<p>Aucun ticket trouvé pour ces informations.</p>'
      : '';

  const rows = tickets.map((t) => `<tr><td>${esc(t.raffleTitle)}</td><td>${t.ticketNumber}</td><td>${t.status}</td><td>${t.source}</td><td>${esc(t.orderReference)}</td><td>${t.createdAt.toISOString()}</td><td>${esc(statusMessage(t.status))}</td></tr>`).join('');

  const table = tickets.length > 0
    ? `<table border="1"><tr><th>Loterie</th><th>Ticket</th><th>Statut</th><th>Source</th><th>Commande</th><th>Créé le</th><th>Message</th></tr>${rows}</table>`
    : '';

  return `<!doctype html><html><body><h1>Mes tickets</h1><form method="post" action="/tickets?shop=${encodeURIComponent(shop)}"><label>Email <input type="email" name="email" value="${esc(email)}" required/></label><label>Numéro de commande / Order ID <input name="orderReference" value="${esc(orderReference)}" required/></label><button type="submit">Rechercher</button></form>${feedback}${table}</body></html>`;
}
