import type { Role, OrderStatus, Unit, Priority, Availability } from "@/generated/prisma/client";

export const BRAND = {
  nameAr: "بوابة الحداثة للتجارة العامة",
  nameEn: "Modernity Gate for General Trading",
  addressAr: "بغداد — العراق",
  phone: "07700000000",
  whatsapp: "07700000000",
  primary: "#3C3C3B",
  accent: "#E85C24",
  accentLight: "#FFF4EF",
  accentDark: "#C44A1A",
  muted: "#6B7280",
  surface: "#F8F9FA",
  logoMark: "/brand/logo.png",
  logoVersion: "20260626",
} as const;

export const UNITS: Record<Unit, { ar: string; en: string }> = {
  KILO: { ar: "كيلو", en: "Kilo" },
  METER: { ar: "متر", en: "Meter" },
  PIECE: { ar: "قطعة", en: "Piece" },
  CARTON: { ar: "كارتونة", en: "Carton" },
};

export const STATUSES: Record<
  OrderStatus,
  { ar: string; en: string; color: string; bg: string }
> = {
  RECEIVED: {
    ar: "استلام",
    en: "Received",
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  PRICING: {
    ar: "التسعير",
    en: "Pricing",
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  PRICED: {
    ar: "تم التسعير",
    en: "Priced",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  ARCHIVED: {
    ar: "أرشيف",
    en: "Archived",
    color: "text-gray-700",
    bg: "bg-gray-100",
  },
};

export const ROLES: Record<Role, { ar: string; en: string }> = {
  ORDER_TAKER: { ar: "مدخل الطلبات", en: "Order Taker" },
  PRICER: { ar: "مسعّر", en: "Pricing Officer" },
  MANAGER: { ar: "مدير", en: "Manager" },
};

export const PRIORITIES: Record<Priority, { ar: string; en: string }> = {
  NORMAL: { ar: "عادي", en: "Normal" },
  URGENT: { ar: "عاجل", en: "Urgent" },
};

export const AVAILABILITY_OPTIONS: Record<
  Availability,
  { ar: string; en: string }
> = {
  YES: { ar: "متوفر", en: "Available" },
  NO: { ar: "غير متوفر", en: "Not Available" },
  ALTERNATIVE: { ar: "بديل متاح", en: "Alternative Available" },
};

export const RETURN_REASONS = {
  ar: [
    "صورة غير واضحة",
    "رابط خاطئ",
    "مواصفات ناقصة",
    "اسم منتج غير واضح",
    "كمية غير صحيحة",
    "سبب آخر",
  ],
  en: [
    "Unclear image",
    "Wrong link",
    "Missing specifications",
    "Unclear product name",
    "Incorrect quantity",
    "Other reason",
  ],
};

export const ORDER_SOURCES = [
  { value: "whatsapp", labelAr: "واتساب", labelEn: "WhatsApp" },
  { value: "call", labelAr: "مكالمة", labelEn: "Phone Call" },
  { value: "visit", labelAr: "زيارة", labelEn: "Visit" },
] as const;

export const NAV_ITEMS = {
  ORDER_TAKER: [
    { href: "/dashboard", labelAr: "الرئيسية", labelEn: "Home", icon: "Home" },
    { href: "/orders", labelAr: "الطلبات", labelEn: "Orders", icon: "Package" },
    { href: "/orders/new", labelAr: "جديد", labelEn: "New", icon: "Plus" },
    { href: "/invoices", labelAr: "الفواتير", labelEn: "Invoices", icon: "FileText" },
    { href: "more", labelAr: "المزيد", labelEn: "More", icon: "LayoutGrid" },
  ],
  PRICER: [
    { href: "/dashboard", labelAr: "الرئيسية", labelEn: "Home", icon: "Home" },
    { href: "/pricing", labelAr: "التسعير", labelEn: "Pricing", icon: "DollarSign" },
    { href: "/priced", labelAr: "ما سعّرتُ", labelEn: "My Priced", icon: "ClipboardCheck" },
  ],
  MANAGER: [
    { href: "/dashboard", labelAr: "الرئيسية", labelEn: "Home", icon: "Home" },
    { href: "/orders", labelAr: "الطلبات", labelEn: "Orders", icon: "Package" },
    { href: "/orders/new", labelAr: "جديد", labelEn: "New", icon: "Plus" },
    { href: "/pricing", labelAr: "التسعير", labelEn: "Pricing", icon: "DollarSign" },
    { href: "more", labelAr: "المزيد", labelEn: "More", icon: "LayoutGrid" },
  ],
} as const;

export const FAB_HREF: Record<Role, string | null> = {
  ORDER_TAKER: "/orders/new",
  PRICER: null,
  MANAGER: "/orders/new",
};

export const MORE_NAV_ITEMS = {
  ORDER_TAKER: [
    { href: "/archive", labelAr: "الأرشيف", labelEn: "Archive", icon: "Archive" },
    { href: "/customers", labelAr: "الزبائن", labelEn: "Customers", icon: "Users" },
  ],
  MANAGER: [
    { href: "/invoices", labelAr: "تم التسعير", labelEn: "Priced", icon: "FileText" },
    { href: "/archive", labelAr: "الأرشيف", labelEn: "Archive", icon: "Archive" },
    { href: "/customers", labelAr: "الزبائن", labelEn: "Customers", icon: "Users" },
    { href: "/admin", labelAr: "الإدارة", labelEn: "Admin", icon: "Settings" },
  ],
  PRICER: [],
} as const;
