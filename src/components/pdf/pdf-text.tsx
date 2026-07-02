import type { ReactNode } from "react";
import { Text, View, type TextProps } from "@react-pdf/renderer";
import { splitMixedText } from "@/lib/pdf-arabic";

const rtlBase = { direction: "rtl" as const, textAlign: "right" as const };
const ltrBase = { direction: "ltr" as const, textAlign: "left" as const };

type Props = TextProps & { children?: ReactNode };

/** Arabic text — fontkit shapes glyphs; no bidi/reshaper. */
export function PdfAr({ children, style, ...props }: Props) {
  return (
    <Text {...props} style={[rtlBase, ...(Array.isArray(style) ? style : style ? [style] : [])]}>
      {children}
    </Text>
  );
}

/** Latin, digits, amounts — always LTR. */
export function PdfNum({ children, style, ...props }: Props) {
  return (
    <Text {...props} style={[ltrBase, ...(Array.isArray(style) ? style : style ? [style] : [])]}>
      {children}
    </Text>
  );
}

/** Mixed Arabic + Latin: one Text node per run, laid out RTL. */
export function PdfMixed({
  children,
  style,
  wrapStyle,
}: {
  children: string;
  style?: TextProps["style"];
  wrapStyle?: TextProps["style"];
}) {
  const runs = splitMixedText(children);
  if (runs.length <= 1) {
    const single = runs[0];
    if (!single) return <PdfAr style={style}> </PdfAr>;
    return single.kind === "ar" ? (
      <PdfAr style={style}>{single.value}</PdfAr>
    ) : (
      <PdfNum style={style}>{single.value}</PdfNum>
    );
  }
  return (
    <View
      style={[
        { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "flex-end" },
        ...(wrapStyle ? (Array.isArray(wrapStyle) ? wrapStyle : [wrapStyle]) : []),
      ]}
    >
      {runs.map((run, i) =>
        run.kind === "ar" ? (
          <PdfAr key={i} style={style}>
            {run.value}
          </PdfAr>
        ) : (
          <PdfNum key={i} style={style}>
            {` ${run.value} `}
          </PdfNum>
        )
      )}
    </View>
  );
}

/** @deprecated Use PdfAr / PdfNum / PdfMixed */
export function PdfText({
  children,
  shape = true,
  style,
  ...props
}: TextProps & { children?: ReactNode; shape?: boolean }) {
  const raw =
    children == null || children === false
      ? ""
      : typeof children === "string"
        ? children
        : String(children);
  if (!shape) return <PdfNum style={style} {...props}>{raw}</PdfNum>;
  return <PdfAr style={style} {...props}>{raw}</PdfAr>;
}
