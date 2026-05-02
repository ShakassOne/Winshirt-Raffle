-- CreateEnum
CREATE TYPE "RaffleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED', 'DRAWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('VALID', 'REFUNDED', 'CANCELLED', 'WINNER');

-- CreateEnum
CREATE TYPE "TicketSource" AS ENUM ('PURCHASE', 'FREE_ENTRY', 'MANUAL');

-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'DRAW', 'IMPORT', 'EXPORT');

-- CreateEnum
CREATE TYPE "FreeEntryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Raffle" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "RaffleStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "maxTickets" INTEGER NOT NULL,
    "soldTicketsCount" INTEGER NOT NULL DEFAULT 0,
    "remainingTicketsCount" INTEGER,
    "freeEntryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "drawLockedAt" TIMESTAMP(3),
    "drawnAt" TIMESTAMP(3),
    "winnerTicketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Raffle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleProduct" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyVariantId" TEXT,
    "title" TEXT,
    "variantTitle" TEXT,
    "ticketsPerUnit" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaffleProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyOrder" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "shopifyOrderNumber" TEXT,
    "customerId" TEXT,
    "customerEmail" TEXT,
    "financialStatus" TEXT,
    "fulfillmentStatus" TEXT,
    "totalPrice" DECIMAL(12,2),
    "currency" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "orderId" TEXT,
    "customerId" TEXT,
    "customerEmail" TEXT,
    "ticketNumber" INTEGER NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'VALID',
    "source" "TicketSource" NOT NULL DEFAULT 'PURCHASE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreeEntry" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstname" TEXT,
    "lastname" TEXT,
    "address" TEXT,
    "ipHash" TEXT,
    "status" "FreeEntryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "actorType" TEXT,
    "actorId" TEXT,
    "action" "AuditActionType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawReport" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "winnerTicketId" TEXT,
    "ticketsSnapshotHash" TEXT,
    "ticketsSnapshotPath" TEXT,
    "drawnAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrawReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Raffle_shopId_slug_key" ON "Raffle"("shopId", "slug");
CREATE INDEX "Raffle_shopId_idx" ON "Raffle"("shopId");
CREATE INDEX "Raffle_slug_idx" ON "Raffle"("slug");
CREATE INDEX "Raffle_status_idx" ON "Raffle"("status");
CREATE INDEX "Raffle_createdAt_idx" ON "Raffle"("createdAt");

CREATE UNIQUE INDEX "RaffleProduct_raffleId_shopifyProductId_shopifyVariantId_key" ON "RaffleProduct"("raffleId", "shopifyProductId", "shopifyVariantId");
CREATE INDEX "RaffleProduct_raffleId_idx" ON "RaffleProduct"("raffleId");
CREATE INDEX "RaffleProduct_createdAt_idx" ON "RaffleProduct"("createdAt");

CREATE UNIQUE INDEX "ShopifyOrder_shopifyOrderId_key" ON "ShopifyOrder"("shopifyOrderId");
CREATE INDEX "ShopifyOrder_shopId_idx" ON "ShopifyOrder"("shopId");
CREATE INDEX "ShopifyOrder_customerEmail_idx" ON "ShopifyOrder"("customerEmail");
CREATE INDEX "ShopifyOrder_financialStatus_idx" ON "ShopifyOrder"("financialStatus");
CREATE INDEX "ShopifyOrder_createdAt_idx" ON "ShopifyOrder"("createdAt");

CREATE UNIQUE INDEX "Ticket_raffleId_ticketNumber_key" ON "Ticket"("raffleId", "ticketNumber");
CREATE INDEX "Ticket_raffleId_idx" ON "Ticket"("raffleId");
CREATE INDEX "Ticket_orderId_idx" ON "Ticket"("orderId");
CREATE INDEX "Ticket_customerEmail_idx" ON "Ticket"("customerEmail");
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");

CREATE INDEX "FreeEntry_raffleId_idx" ON "FreeEntry"("raffleId");
CREATE INDEX "FreeEntry_email_idx" ON "FreeEntry"("email");
CREATE INDEX "FreeEntry_status_idx" ON "FreeEntry"("status");
CREATE INDEX "FreeEntry_createdAt_idx" ON "FreeEntry"("createdAt");

CREATE INDEX "AuditLog_shopId_idx" ON "AuditLog"("shopId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE INDEX "DrawReport_raffleId_idx" ON "DrawReport"("raffleId");
CREATE INDEX "DrawReport_winnerTicketId_idx" ON "DrawReport"("winnerTicketId");
CREATE INDEX "DrawReport_drawnAt_idx" ON "DrawReport"("drawnAt");
CREATE INDEX "DrawReport_createdAt_idx" ON "DrawReport"("createdAt");

-- AddForeignKey
ALTER TABLE "Raffle" ADD CONSTRAINT "Raffle_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Raffle" ADD CONSTRAINT "Raffle_winnerTicketId_fkey" FOREIGN KEY ("winnerTicketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RaffleProduct" ADD CONSTRAINT "RaffleProduct_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopifyOrder" ADD CONSTRAINT "ShopifyOrder_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShopifyOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FreeEntry" ADD CONSTRAINT "FreeEntry_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DrawReport" ADD CONSTRAINT "DrawReport_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DrawReport" ADD CONSTRAINT "DrawReport_winnerTicketId_fkey" FOREIGN KEY ("winnerTicketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
