import {prisma} from './prisma.js';

export async function resolveCurrentShopDomain(explicitShop?: string): Promise<string> {
  if (explicitShop && explicitShop.trim()) return explicitShop.trim().toLowerCase();

  const envShop = process.env.DEV_SHOP_DOMAIN?.trim().toLowerCase();
  if (process.env.NODE_ENV !== 'production' && envShop) return envShop;

  throw new Error('Current shop domain is required. Pass ?shop=<shop>.myshopify.com or set DEV_SHOP_DOMAIN in dev/test.');
}

export async function resolveCurrentShopId(explicitShop?: string): Promise<string> {
  const shopDomain = await resolveCurrentShopDomain(explicitShop);
  const shop = await prisma.shop.upsert({
    where: {shopDomain},
    update: {isInstalled: true, uninstalledAt: null},
    create: {shopDomain, isInstalled: true},
    select: {id: true},
  });

  return shop.id;
}
