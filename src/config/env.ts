export type AppEnv = {
  SHOPIFY_API_KEY: string;
  SHOPIFY_API_SECRET: string;
  SCOPES: string;
  SHOPIFY_APP_URL: string;
  DATABASE_URL: string;
  SESSION_SECRET: string;
};

export function readEnv(): AppEnv {
  return {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ?? '',
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ?? '',
    SCOPES: process.env.SCOPES ?? 'read_products',
    SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL ?? 'https://example.com',
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    SESSION_SECRET: process.env.SESSION_SECRET ?? ''
  };
}
