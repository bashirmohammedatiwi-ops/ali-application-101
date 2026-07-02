import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("123456", 12);

  await prisma.user.upsert({
    where: { email: "taker@modernitygate.com" },
    update: { passwordHash },
    create: {
      name: "مدخل الطلبات",
      email: "taker@modernitygate.com",
      passwordHash,
      role: "ORDER_TAKER",
      language: "ar",
    },
  });

  await prisma.user.upsert({
    where: { email: "pricer@modernitygate.com" },
    update: { passwordHash },
    create: {
      name: "Pricing Officer",
      email: "pricer@modernitygate.com",
      passwordHash,
      role: "PRICER",
      language: "en",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@modernitygate.com" },
    update: { passwordHash },
    create: {
      name: "المدير",
      email: "manager@modernitygate.com",
      passwordHash,
      role: "MANAGER",
      language: "ar",
    },
  });

  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyNameAr: "بوابة الحداثة للتجارة العامة",
      companyNameEn: "Modernity Gate for General Trading",
      companyAddressAr: "بغداد — العراق",
      companyPhone: "07700000000",
      usdToCnyRate: 7.2,
      usdToIqdRate: 1310,
    },
  });

  const taker = await prisma.user.findUnique({
    where: { email: "taker@modernitygate.com" },
  });

  if (taker && (await prisma.customer.count()) === 0) {
    const customer = await prisma.customer.create({
      data: {
        name: "أحمد محمد",
        phone: "07901234567",
        whatsapp: "07901234567",
        address: "بغداد - الكرادة",
        city: "بغداد",
      },
    });

    const request = await prisma.customerRequest.create({
      data: {
        refNumber: "REQ-2026-0001",
        customerId: customer.id,
        createdById: taker.id,
        source: "whatsapp",
      },
    });

    await prisma.orderItem.create({
      data: {
        refNumber: "ORD-2026-0001",
        requestId: request.id,
        status: "PRICING",
        productNameAr: "شريط LED ملون 5050",
        productNameEn: "LED Strip Light 5050 RGB",
        quantity: 500,
        unit: "PIECE",
        notesAr: "مقاوم للماء IP65",
        notesEn: "Waterproof IP65",
        productLink: "https://1688.com",
        priority: "URGENT",
      },
    });

    await prisma.orderItem.create({
      data: {
        refNumber: "ORD-2026-0002",
        requestId: request.id,
        status: "RECEIVED",
        productNameAr: "محول كهرباء 12V",
        productNameEn: "12V Power Adapter",
        quantity: 200,
        unit: "PIECE",
        notesAr: "للاستخدام مع LED",
        notesEn: "For LED use",
      },
    });

    console.log("Sample orders created.");
  }

  console.log("Seed completed.");
  console.log("Demo accounts (password: 123456):");
  console.log("  Order Taker: taker@modernitygate.com");
  console.log("  Pricer:      pricer@modernitygate.com");
  console.log("  Manager:     manager@modernitygate.com");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
