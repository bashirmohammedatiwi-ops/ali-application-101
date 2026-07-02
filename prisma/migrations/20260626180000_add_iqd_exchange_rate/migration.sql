-- Add Iraqi Dinar exchange rate to app settings (1 USD = X IQD)
ALTER TABLE "AppSettings" ADD COLUMN "usdToIqdRate" REAL NOT NULL DEFAULT 1310;
