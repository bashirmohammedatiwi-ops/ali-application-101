import type { ReactNode } from "react";
import { Text, type TextProps } from "@react-pdf/renderer";
import { shapeArabicText } from "@/lib/pdf-arabic";

type PdfTextProps = Omit<TextProps, "children"> & {
  children?: ReactNode;
  /** Set false for pure Latin/numbers when bidi causes issues */
  shape?: boolean;
};

function flattenText(children: ReactNode): string {
  if (children == null || children === false) return "";
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(flattenText).join("");
  return String(children);
}

export function PdfText({ children, shape = true, ...props }: PdfTextProps) {
  const raw = flattenText(children);
  const content = shape ? shapeArabicText(raw) : raw;
  return <Text {...props}>{content}</Text>;
}
