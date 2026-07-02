-- Company contact fields for PDF invoice header/footer
ALTER TABLE "AppSettings" ADD COLUMN "companyAddressAr" TEXT NOT NULL DEFAULT 'بغداد — العراق';
ALTER TABLE "AppSettings" ADD COLUMN "companyPhone" TEXT NOT NULL DEFAULT '07700000000';
