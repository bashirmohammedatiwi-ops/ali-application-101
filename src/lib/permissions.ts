import type { Role, OrderStatus } from "@/generated/prisma/client";

type Permission =
  | "create_customer"
  | "create_order"
  | "edit_order_received"
  | "send_to_pricing"
  | "price_order"
  | "return_to_received"
  | "view_invoice"
  | "send_invoice"
  | "archive_order"
  | "search_archive"
  | "return_from_archived"
  | "return_from_priced"
  | "manage_users"
  | "view_reports"
  | "edit_markup"
  | "edit_priced_quantity"
  | "view_own_priced"
  | "delete_order";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ORDER_TAKER: [
    "create_customer",
    "create_order",
    "edit_order_received",
    "send_to_pricing",
    "view_invoice",
    "send_invoice",
    "archive_order",
    "search_archive",
    "edit_priced_quantity",
    "edit_markup",
  ],
  PRICER: [
    "price_order",
    "return_to_received",
    "view_own_priced",
  ],
  MANAGER: [
    "create_customer",
    "create_order",
    "edit_order_received",
    "send_to_pricing",
    "price_order",
    "return_to_received",
    "view_invoice",
    "send_invoice",
    "archive_order",
    "search_archive",
    "return_from_archived",
    "return_from_priced",
    "manage_users",
    "view_reports",
    "edit_markup",
    "edit_priced_quantity",
    "delete_order",
  ],
};

export function hasPermission(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

const EDITABLE_STATUSES: OrderStatus[] = ["RECEIVED", "PRICING", "ARCHIVED"];

export function canEditOrder(role: Role, status: OrderStatus): boolean {
  return (
    hasPermission(role, "edit_order_received") &&
    EDITABLE_STATUSES.includes(status)
  );
}

export function canEditPricedQuantity(role: Role, status: OrderStatus): boolean {
  return (
    status === "PRICED" &&
    hasPermission(role, "edit_priced_quantity")
  );
}

export function canTransitionStatus(
  role: Role,
  from: OrderStatus,
  to: OrderStatus
): boolean {
  const transitions: Record<string, Role[]> = {
    "RECEIVED->PRICING": ["ORDER_TAKER", "MANAGER"],
    "PRICING->RECEIVED": ["PRICER", "MANAGER"],
    "PRICING->PRICED": ["PRICER", "MANAGER"],
    "PRICED->PRICING": ["MANAGER"],
    "PRICED->ARCHIVED": ["ORDER_TAKER", "MANAGER"],
    "ARCHIVED->PRICING": ["ORDER_TAKER", "MANAGER"],
    "ARCHIVED->PRICED": ["MANAGER"],
  };
  const key = `${from}->${to}`;
  return transitions[key]?.includes(role) ?? false;
}

export function canReturnToPricing(role: Role, status: OrderStatus): boolean {
  if (status === "PRICED") return hasPermission(role, "return_from_priced");
  if (status === "ARCHIVED") return hasPermission(role, "send_to_pricing");
  return false;
}

export function getDefaultLocale(role: Role): "ar" | "en" {
  return role === "PRICER" ? "en" : "ar";
}
