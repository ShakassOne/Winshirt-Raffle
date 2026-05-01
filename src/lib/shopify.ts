import { readEnv } from "../config/env.js";

export function getShopifyAuthConfig() {
  const env = readEnv();
  return {
    apiKey: env.SHOPIFY_API_KEY,
    apiSecret: env.SHOPIFY_API_SECRET,
    scopes: env.SCOPES.split(",").map((scope) => scope.trim()).filter(Boolean),
    appUrl: env.SHOPIFY_APP_URL
  };
}
