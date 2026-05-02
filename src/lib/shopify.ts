import '@shopify/shopify-api/adapters/node';
import {LATEST_API_VERSION, shopifyApi} from '@shopify/shopify-api';
import {PrismaClient} from '@prisma/client';
import {PrismaSessionStorage} from '@shopify/shopify-app-session-storage-prisma';
import {readEnv} from '../config/env.js';

const env = readEnv();
const prisma = new PrismaClient();
const sessionStorage = new PrismaSessionStorage(prisma);

export const shopify = shopifyApi({
  apiKey: env.SHOPIFY_API_KEY,
  apiSecretKey: env.SHOPIFY_API_SECRET,
  scopes: env.SCOPES.split(',').map((scope) => scope.trim()).filter(Boolean),
  hostName: new URL(env.SHOPIFY_APP_URL).host,
  hostScheme: 'https',
  isEmbeddedApp: true,
  apiVersion: LATEST_API_VERSION,
  isCustomStoreApp: false,
  sessionStorage,
});

export {prisma};
