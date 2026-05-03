import express, {Request, Response} from 'express';
import {DeliveryMethod} from '@shopify/shopify-api';
import {shopify} from './lib/shopify.js';
import {healthResponse} from './routes/public/health.js';
import {prisma} from './lib/prisma.js';
import {handleAppUninstalled} from './lib/uninstall.js';
import {createRaffle, raffleForm, renderRafflesPage, updateRaffle, upsertRaffleProduct} from './routes/admin/index.js';
import {renderOrderDetailsPage, renderOrdersPage, renderTicketDetailsPage, renderTicketsPage} from './routes/admin/tickets-orders.js';
import {handleOrderPaid} from './lib/order-paid.js';
import {handleOrderCancelled} from './lib/order-cancelled.js';
import {handleRefundCreated} from './lib/refund-created.js';

const PORT = Number(process.env.PORT ?? 3000);
const app = express();

app.use(express.json({type: '*/*'}));
app.use(express.urlencoded({extended: true}));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).type('application/json').send(healthResponse());
});

app.get('/auth', async (req: Request, res: Response) => {
  const shop = String(req.query.shop ?? '');
  await shopify.auth.begin({shop, callbackPath: '/auth/callback', isOnline: false, rawRequest: req, rawResponse: res});
});

app.get('/auth/callback', async (req: Request, res: Response) => {
  const callback = await shopify.auth.callback({rawRequest: req, rawResponse: res});

  await shopify.webhooks.register({session: callback.session});

  const host = String(req.query.host ?? '');
  res.redirect(`/?shop=${callback.session.shop}&host=${encodeURIComponent(host)}`);
});

app.post('/webhooks', async (req: Request, res: Response) => {
  try {
    await shopify.webhooks.process({
      rawBody: JSON.stringify(req.body),
      rawRequest: req,
      rawResponse: res,
    });
  } catch (error) {
    console.error('Webhook processing failed', error);
    if (!res.headersSent) res.status(500).send('Webhook error');
  }
});

const webhookDeliveryMethod = DeliveryMethod.Http;

shopify.webhooks.addHandlers({

  ORDERS_PAID: {
    deliveryMethod: webhookDeliveryMethod,
    callbackUrl: '/webhooks',
    callback: async (_topic: string, shop: string, body: string) => {
      try {
        const payload = JSON.parse(body);
        const result = await handleOrderPaid(shop, payload);
        console.log(`[webhook] orders/paid processed for ${shop}: ${result}`);
      } catch (error) {
        console.error(`[webhook] orders/paid failed for ${shop}`, error);
        throw error;
      }
    }
  },

  ORDERS_CANCELLED: {
    deliveryMethod: webhookDeliveryMethod,
    callbackUrl: '/webhooks',
    callback: async (_topic: string, shop: string, body: string) => {
      const payload = JSON.parse(body);
      const result = await handleOrderCancelled(shop, payload);
      console.log(`[webhook] orders/cancelled processed for ${shop}: ${result}`);
    }
  },
  REFUNDS_CREATE: {
    deliveryMethod: webhookDeliveryMethod,
    callbackUrl: '/webhooks',
    callback: async (_topic: string, shop: string, body: string) => {
      const payload = JSON.parse(body);
      const result = await handleRefundCreated(shop, payload);
      console.log(`[webhook] refunds/create processed for ${shop}: ${result}`);
    }
  },
  APP_UNINSTALLED: {
    deliveryMethod: webhookDeliveryMethod,
    callbackUrl: '/webhooks',
    callback: async (_topic: string, shop: string) => {
      try {
        await handleAppUninstalled(shop, {shop: prisma.shop, session: prisma.session});
        console.log(`[webhook] app/uninstalled processed for ${shop}`);
      } catch (error) {
        console.error(`[webhook] app/uninstalled failed for ${shop}`, error);
        throw error;
      }
    }
  }
});

app.get('/', (_req: Request, res: Response) => {
  res.redirect('/admin');
});

app.get('/admin', async (req: Request, res: Response) => {
  const shop = String(req.query.shop ?? '');
  const page = await renderRafflesPage(shop);
  res.status(200).type('text/html; charset=utf-8').send(page);
});


app.get('/admin/tickets', async (req: Request, res: Response) => {
  const shop = String(req.query.shop ?? '');
  const page = await renderTicketsPage(shop, req.query);
  res.status(200).type('text/html; charset=utf-8').send(page);
});

app.get('/admin/tickets/:id', async (req: Request, res: Response) => {
  const shop = String(req.query.shop ?? '');
  const page = await renderTicketDetailsPage(shop, req.params.id);
  res.status(200).type('text/html; charset=utf-8').send(page);
});

app.get('/admin/orders', async (req: Request, res: Response) => {
  const shop = String(req.query.shop ?? '');
  const page = await renderOrdersPage(shop, req.query);
  res.status(200).type('text/html; charset=utf-8').send(page);
});

app.get('/admin/orders/:id', async (req: Request, res: Response) => {
  const shop = String(req.query.shop ?? '');
  const page = await renderOrderDetailsPage(shop, req.params.id);
  res.status(200).type('text/html; charset=utf-8').send(page);
});
app.get('/admin/raffles/new', (req: Request, res: Response) => {
  const shop = String(req.query.shop ?? '');
  res.status(200).type('text/html; charset=utf-8').send(raffleForm('/admin/raffles', shop, []));
});

app.post('/admin/raffles', async (req: Request, res: Response) => {
  const shop = String(req.query.shop ?? '');
  const result = await createRaffle(shop, req.body);
  if (result.errors) return res.status(400).type('text/html; charset=utf-8').send(raffleForm('/admin/raffles', shop, result.errors, req.body));
  return res.redirect(`/admin?shop=${encodeURIComponent(shop)}`);
});

app.get('/admin/raffles/:id', async (req: Request, res: Response) => {
  const shop = String(req.query.shop ?? '');
  const form = raffleForm(`/admin/raffles/${req.params.id}`, shop, []);
  res.status(200).type('text/html; charset=utf-8').send(form + `<h2>Raffle product</h2><form method="post" action="/admin/raffles/${req.params.id}/products?shop=${encodeURIComponent(shop)}"><input name="shopifyProductId" placeholder="shopifyProductId"/><input name="shopifyVariantId" placeholder="shopifyVariantId"/><input name="title" placeholder="title"/><input name="variantTitle" placeholder="variantTitle"/><input type="number" name="ticketsPerUnit" value="1"/><select name="enabled"><option value="true">enabled</option><option value="false">disabled</option></select><button type="submit">Save product</button></form>`);
});

app.post('/admin/raffles/:id', async (req: Request, res: Response) => {
  const shop = String(req.query.shop ?? '');
  const result = await updateRaffle(shop, req.params.id, req.body);
  if (result.errors) return res.status(400).type('text/html; charset=utf-8').send(raffleForm(`/admin/raffles/${req.params.id}`, shop, result.errors, req.body));
  return res.redirect(`/admin?shop=${encodeURIComponent(shop)}`);
});

app.post('/admin/raffles/:id/products', async (req: Request, res: Response) => {
  const shop = String(req.query.shop ?? '');
  const result = await upsertRaffleProduct(shop, req.params.id, req.body);
  if (result.errors) return res.status(400).send(result.errors.join(','));
  return res.redirect(`/admin/raffles/${req.params.id}?shop=${encodeURIComponent(shop)}`);
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`WinShirt Raffle app running on port ${PORT}`);
  });
}
