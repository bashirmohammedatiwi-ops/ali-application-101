import type { ReactNode } from "react";
import { Text, type TextProps } from "@react-pdf/renderer";
import { shapeArabicText } from "@/lib/pdf-arabic";

type PdfTextProps = Omit<TextProps, "children"> & {
  children?: ReactNode;
  /** false for invoice codes, amounts, pure Latin */
  shape?: boolean;
};

function flattenText(children: ReactNode): string {
  if (children == null || children === false) return "";
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(flattenText).join("");
  return String(children);
}

function withDirection(
  style: TextProps["style"],
  rtl: boolean
): TextProps["style"] {
  const dir = { direction: rtl ? ("rtl" as const) : ("ltr" as const) };
  if (!style) return dir;
  if (Array.isArray(style)) return [dir, ...style];
  return [dir, style];
}

export function PdfText({ children, shape = true, style, ...props }: PdfTextProps) {
  const raw = flattenText(children);
  const content = shape ? shapeArabicText(raw) : raw;
  return (
    <Text {...props} style={withDirection(style, shape)}>
      {content}
    </Text>
  );
}
