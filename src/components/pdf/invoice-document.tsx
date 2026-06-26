import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { Invoice, OrderItem, Customer, AppSettings } from "@/generated/prisma/client";
import { calculateMarkupAmount, formatMarkupPercent } from "@/lib/markup";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#3C3C3B",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    borderBottom: "2 solid #E85C24",
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3C3C3B",
  },
  subtitle: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
  },
  accent: {
    color: "#E85C24",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#E85C24",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    color: "#6B7280",
  },
  value: {
    fontWeight: "bold",
  },
  productBox: {
    border: "1 solid #E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  totalBox: {
    backgroundColor: "#FFF4EF",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#E85C24",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: "1 solid #E5E7EB",
    paddingTop: 12,
    fontSize: 8,
    color: "#6B7280",
    textAlign: "center",
  },
});

type InvoiceDocProps = {
  invoice: Invoice;
  item: OrderItem & { images?: { url: string }[] };
  customer: Customer;
  settings: AppSettings;
  unitLabel: string;
};

export function InvoiceDocument({
  invoice,
  item,
  customer,
  settings,
  unitLabel,
}: InvoiceDocProps) {
  const imageUrl = item.images?.[0]?.url;
  const absoluteImageUrl = imageUrl?.startsWith("http")
    ? imageUrl
    : imageUrl
      ? `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}${imageUrl}`
      : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{settings.companyNameEn}</Text>
            <Text style={styles.subtitle}>{settings.companyNameAr}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.title, styles.accent]}>QUOTATION</Text>
            <Text style={styles.subtitle}>فاتورة تسعير</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice No:</Text>
            <Text style={styles.value}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Order No:</Text>
            <Text style={styles.value}>{item.refNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Currency:</Text>
            <Text style={styles.value}>{item.currency}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer / الزبون</Text>
          <Text style={styles.value}>{customer.name}</Text>
          <Text>{customer.phone}</Text>
          {customer.address && <Text>{customer.address}</Text>}
        </View>

        <View style={styles.productBox}>
          {absoluteImageUrl && (
            <Image
              src={absoluteImageUrl}
              style={{ width: 80, height: 80, objectFit: "cover", marginBottom: 8 }}
            />
          )}
          <Text style={{ fontSize: 12, fontWeight: "bold", marginBottom: 4 }}>
            {item.productNameEn ?? item.productNameAr}
          </Text>
          <Text style={{ color: "#6B7280", marginBottom: 8 }}>
            {item.productNameAr}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Quantity:</Text>
            <Text style={styles.value}>
              {item.quantity} {unitLabel}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Unit Price:</Text>
            <Text style={styles.value}>
              {item.unitPrice} {item.currency}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal:</Text>
            <Text style={styles.value}>
              {invoice.subtotal.toFixed(2)} {item.currency}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Internal Shipping:</Text>
            <Text style={styles.value}>
              {invoice.shipping.toFixed(2)} {item.currency}
            </Text>
          </View>
          {invoice.markup > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>
                Markup ({formatMarkupPercent(invoice.markup)}):
              </Text>
              <Text style={styles.value}>
                {calculateMarkupAmount(invoice.subtotal, invoice.shipping, invoice.markup).toFixed(2)}{" "}
                {item.currency}
              </Text>
            </View>
          )}
          <View style={styles.totalBox}>
            <View style={styles.row}>
              <Text style={styles.grandTotal}>GRAND TOTAL:</Text>
              <Text style={styles.grandTotal}>
                {invoice.grandTotal.toFixed(2)} {item.currency}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Info</Text>
          {item.weightKg && (
            <View style={styles.row}>
              <Text style={styles.label}>Weight:</Text>
              <Text>{item.weightKg} kg</Text>
            </View>
          )}
          {item.volumeCbm && (
            <View style={styles.row}>
              <Text style={styles.label}>Volume:</Text>
              <Text>{item.volumeCbm} cbm</Text>
            </View>
          )}
          {item.moq && (
            <View style={styles.row}>
              <Text style={styles.label}>MOQ:</Text>
              <Text>
                {item.moq} {unitLabel}
              </Text>
            </View>
          )}
          {item.leadTimeDays && (
            <View style={styles.row}>
              <Text style={styles.label}>Lead Time:</Text>
              <Text>{item.leadTimeDays} days</Text>
            </View>
          )}
        </View>

        <Text style={styles.footer}>
          International shipping calculated separately. | الأسعار لا تشمل الشحن الدولي
        </Text>
      </Page>
    </Document>
  );
}
