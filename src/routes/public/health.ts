export function healthResponse(): string {
  return JSON.stringify({ ok: true, app: "winshirt-raffle-shopify-app" });
}
