import type { Unit, Priority } from "@/generated/prisma/client";
import { randomId } from "@/lib/utils";

export type ProductFormData = {
  id: string;
  productNameAr: string;
  quantity: string;
  unit: Unit;
  productLink: string;
  notesAr: string;
  priority: Priority;
  imageUrls: string[];
  color: string;
  size: string;
  model: string;
};

export type CustomerFormData = {
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
};

export function emptyProduct(): ProductFormData {
  return {
    id: randomId(),
    productNameAr: "",
    quantity: "",
    unit: "PIECE",
    productLink: "",
    notesAr: "",
    priority: "NORMAL",
    imageUrls: [],
    color: "",
    size: "",
    model: "",
  };
}
