export function readEnv() {
    return {
        SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ?? "",
        SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ?? "",
        SCOPES: process.env.SCOPES ?? "",
        SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL ?? "",
        DATABASE_URL: process.env.DATABASE_URL ?? "",
        SESSION_SECRET: process.env.SESSION_SECRET ?? ""
    };
}
