# Database domain model (V1 foundation)

## Included models
- `Shop`: Shopify store installation lifecycle and ownership root.
- `Session`: Shopify OAuth/session persistence.
- `Raffle`: core raffle configuration and lifecycle status.
- `RaffleProduct`: mapping between raffle and Shopify product/variant with tickets multiplier.
- `ShopifyOrder`: normalized Shopify order metadata used as ticket source.
- `Ticket`: raffle ticket records (purchase/free/manual), status, and per-raffle numbering.
- `FreeEntry`: free participation submissions attached to a raffle.
- `AuditLog`: immutable audit events for business actions.
- `DrawReport`: future-proof draw traceability payload (snapshot hash/path + draw timestamp).

## What is included in this iteration
- Prisma enums for raffle lifecycle, ticket lifecycle/source, free entry state, and audit actions.
- Referential links from domain models to `Shop` and between raffle/order/ticket/report entities.
- Uniqueness constraints for raffle slug per shop and ticket number per raffle.
- Baseline indexes for operational queries (`status`, `createdAt`, `customerEmail`, ids/foreign keys).
- SQL migration scaffold: `add_raffle_domain_models`.

## Not implemented yet
- No admin UI/CRUD screens.
- No paid order webhooks processing.
- No refund/cancellation business workflow automation.
- No ticket generation logic.
- No real draw execution.
- No storefront/theme app extension features.
