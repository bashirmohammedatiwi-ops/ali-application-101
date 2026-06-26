-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_status_updatedAt_idx" ON "OrderItem"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "OrderItem_refNumber_idx" ON "OrderItem"("refNumber");

-- CreateIndex
CREATE INDEX "OrderItem_updatedAt_idx" ON "OrderItem"("updatedAt");
