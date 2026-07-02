-- G2Bulk supplier price monitoring tables
CREATE TABLE IF NOT EXISTS "G2BulkPriceSnapshot" (
    "id" SERIAL NOT NULL,
    "itemKey" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sourceUsd" DECIMAL(12,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "G2BulkPriceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "G2BulkPriceSnapshot_itemKey_key" ON "G2BulkPriceSnapshot"("itemKey");

CREATE TABLE IF NOT EXISTS "G2BulkPriceAlert" (
    "id" SERIAL NOT NULL,
    "itemKey" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "previousUsd" DECIMAL(12,4) NOT NULL,
    "currentUsd" DECIMAL(12,4) NOT NULL,
    "increaseUsd" DECIMAL(12,4) NOT NULL,
    "increasePct" DECIMAL(8,2) NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "G2BulkPriceAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "G2BulkPriceAlert_dismissed_createdAt_idx" ON "G2BulkPriceAlert"("dismissed", "createdAt");
CREATE INDEX IF NOT EXISTS "G2BulkPriceAlert_itemKey_idx" ON "G2BulkPriceAlert"("itemKey");

-- Shop settings G2Bulk monitoring columns (idempotent)
ALTER TABLE "ShopSettings" ADD COLUMN IF NOT EXISTS "g2bulkLowBalanceThreshold" DECIMAL(12,2);
ALTER TABLE "ShopSettings" ADD COLUMN IF NOT EXISTS "g2bulkPriceAlertMinPct" DECIMAL(5,2) NOT NULL DEFAULT 2;
ALTER TABLE "ShopSettings" ADD COLUMN IF NOT EXISTS "g2bulkPriceAlertMinUsd" DECIMAL(12,4) NOT NULL DEFAULT 0.25;
ALTER TABLE "ShopSettings" ADD COLUMN IF NOT EXISTS "g2bulkAutoPriceSync" BOOLEAN NOT NULL DEFAULT true;
