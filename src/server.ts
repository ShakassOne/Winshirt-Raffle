import express, {Request, Response} from 'express';
import {DeliveryMethod} from '@shopify/shopify-api';
import {shopify, prisma} from './lib/shopify.js';
import {healthResponse} from './routes/public/health.js';
import {adminPage} from './routes/admin/index.js';

const PORT = Number(process.env.PORT ?? 3000);
const app = express();

app.use(express.json({type: '*/*'}));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).type('application/json').send(healthResponse());
});

app.get('/auth', async (req: Request, res: Response) => {
  const shop = String(req.query.shop ?? '');
  await shopify.auth.begin({shop, callbackPath: '/auth/callback', isOnline: false, rawRequest: req, rawResponse: res});
});

app.get('/auth/callback', async (req: Request, res: Response) => {
  const callback = await shopify.auth.callback({rawRequest: req, rawResponse: res});

  await prisma.shop.upsert({
    where: {shopDomain: callback.session.shop},
    update: {accessToken: callback.session.accessToken ?? '', uninstalledAt: null},
    create: {shopDomain: callback.session.shop, accessToken: callback.session.accessToken ?? ''}
  });

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

shopify.webhooks.addHandlers({
  APP_UNINSTALLED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: '/webhooks',
    callback: async (_topic: string, shop: string) => {
      await prisma.shop.updateMany({where: {shopDomain: shop}, data: {uninstalledAt: new Date()}});
      await prisma.session.deleteMany({where: {shop}});
      console.log(`[webhook] app/uninstalled processed for ${shop}`);
    }
  }
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).type('text/html; charset=utf-8').send(adminPage());
});

app.get('/admin', (_req: Request, res: Response) => {
  res.status(200).type('text/html; charset=utf-8').send(adminPage());
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`WinShirt Raffle app running on port ${PORT}`);
  });
}
