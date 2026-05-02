import '@shopify/shopify-api/adapters/node';
import {LATEST_API_VERSION, shopifyApi} from '@shopify/shopify-api';
import {PrismaClient} from '@prisma/client';
import {inMemorySessionStorage} from './sessionStorage.js';
import {readEnv} from '../config/env.js';

const env = readEnv();
const appUrl = env.SHOPIFY_APP_URL?.trim() || 'https://example.com';
const hostName = new URL(appUrl).host;
const prisma = new PrismaClient();
const sessionStorage = inMemorySessionStorage;

export const shopify = shopifyApi({
  apiKey: env.SHOPIFY_API_KEY,
  apiSecretKey: env.SHOPIFY_API_SECRET,
  scopes: env.SCOPES.split(',').map((scope) => scope.trim()).filter(Boolean),
  hostName,
  hostScheme: 'https',
  isEmbeddedApp: true,
  apiVersion: LATEST_API_VERSION,
  isCustomStoreApp: false,
  sessionStorage,
});

export {prisma};
