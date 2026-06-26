import { getSessionUser } from "@/lib/session-user";
import { getCustomers } from "@/lib/queries";
import { getLocaleFromRole, t } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, ListToolbar } from "@/components/ui/action-tile";
import Link from "next/link";
import { SearchBar } from "@/components/ui/search-bar";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { EmptyState } from "@/components/orders/order-card";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getSessionUser();
  const locale = getLocaleFromRole(user!.role);
  const params = await searchParams;
  const customers = await getCustomers(params.q);
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <div className="page-container">
      <PageHeader
        title={locale === "en" ? "Customers" : "الزبائن"}
        subtitle={
          locale === "en"
            ? `${customers.length} registered customers`
            : `${customers.length} زبون مسجّل`
        }
      />

      <ListToolbar>
        <Suspense>
          <SearchBar locale={locale} />
        </Suspense>
      </ListToolbar>

      <div className="card-list-grid">
        {customers.length === 0 ? (
          <EmptyState message={t("noResults", locale)} />
        ) : (
          customers.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card className="flex items-center gap-3.5 p-4" interactive padding={false}>
                <Avatar name={c.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-brand truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5" dir="ltr">
                    {c.phone}
                  </p>
                  {c.city && (
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {c.city}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black text-accent bg-accent-light min-w-[28px] h-7 flex items-center justify-center rounded-full px-2">
                    {c._count.requests}
                  </span>
                  <Chevron className="h-4 w-4 text-gray-300" />
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
