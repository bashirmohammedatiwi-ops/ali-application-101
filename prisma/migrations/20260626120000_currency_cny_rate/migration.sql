-- Remove IQD fields from Invoice; replace AppSettings exchange fields with CNY rate
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "shipping" REAL NOT NULL,
    "markup" REAL NOT NULL DEFAULT 0,
    "extraFees" REAL NOT NULL DEFAULT 0,
    "grandTotal" REAL NOT NULL,
    "pdfPath" TEXT,
    "sentAt" DATETIME,
    "sentVia" TEXT,
    "sentById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Invoice" (
    "id", "invoiceNumber", "orderItemId", "subtotal", "shipping", "markup", "extraFees",
    "grandTotal", "pdfPath", "sentAt", "sentVia", "sentById", "createdAt", "updatedAt"
)
SELECT
    "id", "invoiceNumber", "orderItemId", "subtotal", "shipping", "markup", "extraFees",
    "grandTotal", "pdfPath", "sentAt", "sentVia", "sentById", "createdAt", "updatedAt"
FROM "Invoice";

DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX "Invoice_orderItemId_key" ON "Invoice"("orderItemId");
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

CREATE TABLE "new_AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyNameAr" TEXT NOT NULL DEFAULT 'بوابة الحداثة للتجارة العامة',
    "companyNameEn" TEXT NOT NULL DEFAULT 'Modernity Gate for General Trading',
    "usdToCnyRate" REAL NOT NULL DEFAULT 7.2,
    "defaultMarkup" REAL NOT NULL DEFAULT 0
);

INSERT INTO "new_AppSettings" ("id", "companyNameAr", "companyNameEn", "usdToCnyRate", "defaultMarkup")
SELECT "id", "companyNameAr", "companyNameEn", 7.2, "defaultMarkup"
FROM "AppSettings";

DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";

PRAGMA foreign_keys=ON;
