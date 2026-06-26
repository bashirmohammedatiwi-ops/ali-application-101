-- Remove global defaultMarkup; markup is set per invoice
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyNameAr" TEXT NOT NULL DEFAULT 'بوابة الحداثة للتجارة العامة',
    "companyNameEn" TEXT NOT NULL DEFAULT 'Modernity Gate for General Trading',
    "usdToCnyRate" REAL NOT NULL DEFAULT 7.2
);

INSERT INTO "new_AppSettings" ("id", "companyNameAr", "companyNameEn", "usdToCnyRate")
SELECT "id", "companyNameAr", "companyNameEn", "usdToCnyRate" FROM "AppSettings";

DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";

PRAGMA foreign_keys=ON;
