import { prisma } from "@/lib/db";

let initialized = false;

/** SQLite performance tuning for VPS — run once at startup */
export async function initDatabase() {
  if (initialized) return;
  initialized = true;

  try {
    await prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL;");
    await prisma.$executeRawUnsafe("PRAGMA synchronous = NORMAL;");
    await prisma.$executeRawUnsafe("PRAGMA cache_size = -64000;");
    await prisma.$executeRawUnsafe("PRAGMA temp_store = MEMORY;");
    await prisma.$executeRawUnsafe("PRAGMA mmap_size = 268435456;");
  } catch {
    // Non-fatal — may fail in some environments
  }
}
