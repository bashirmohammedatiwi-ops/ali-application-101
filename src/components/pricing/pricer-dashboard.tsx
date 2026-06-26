import Link from "next/link";
import {
  DollarSign,
  ClipboardCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  PartyPopper,
} from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { PricingQueueCard } from "@/components/pricing/pricing-queue-card";
import { PricerEmptyState } from "@/components/pricing/pricer-empty-state";
import { t, type Locale } from "@/lib/i18n";
import type { getPricerStats } from "@/lib/queries";

type PricerStats = Awaited<ReturnType<typeof getPricerStats>>;

export function PricerDashboard({
  stats,
  locale,
  firstName,
}: {
  stats: PricerStats;
  locale: Locale;
  firstName: string;
}) {
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;
  const dailyGoal = Math.max(stats.pricedToday + stats.pendingCount, stats.pricedToday, 1);
  const dailyProgress = Math.round((stats.pricedToday / dailyGoal) * 100);

  return (
    <div className="page-container">
      <section className="pricer-hero">
        <div className="pricer-hero-glow" aria-hidden />
        <div className="relative z-10">
          <p className="text-sm font-semibold text-white/70">
            {t("welcome", locale)}, {firstName}
          </p>
          <h1 className="text-2xl font-black text-white mt-1 leading-tight">
            {locale === "en" ? "Pricing Workspace" : "مساحة التسعير"}
          </h1>
          <p className="text-sm text-white/60 mt-2">
            {locale === "en"
              ? "Review queue, price orders, track your work"
              : "راجع الطلبات، سعّرها، وتابع إنجازك"}
          </p>

          <div className="grid grid-cols-3 gap-2.5 mt-6">
            <div className="pricer-stat-pill">
              <p className="text-2xl font-black text-white tabular-nums">{stats.pendingCount}</p>
              <p className="text-[10px] font-semibold text-white/65 mt-1 uppercase tracking-wide">
                {locale === "en" ? "Pending" : "معلق"}
              </p>
            </div>
            <div className="pricer-stat-pill pricer-stat-pill--accent">
              <p className="text-2xl font-black text-white tabular-nums">{stats.pricedToday}</p>
              <p className="text-[10px] font-semibold text-white/65 mt-1 uppercase tracking-wide">
                {locale === "en" ? "Today" : "اليوم"}
              </p>
            </div>
            <div className="pricer-stat-pill">
              <p className="text-2xl font-black text-white tabular-nums">{stats.myPricedCount}</p>
              <p className="text-[10px] font-semibold text-white/65 mt-1 uppercase tracking-wide">
                {locale === "en" ? "Total" : "الإجمالي"}
              </p>
            </div>
          </div>

          {stats.pricedToday > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-[11px] text-white/55 mb-1.5">
                <span>{locale === "en" ? "Today's progress" : "إنجاز اليوم"}</span>
                <span className="font-bold text-white/80">{dailyProgress}%</span>
              </div>
              <div className="pricer-progress-track">
                <div
                  className="pricer-progress-fill"
                  style={{ width: `${Math.min(dailyProgress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {stats.overdueCount > 0 && (
        <Link href="/pricing?filter=overdue" className="pricer-alert">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">
              {locale === "en" ? "Overdue Orders" : "طلبات متأخرة"}
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {locale === "en"
                ? `${stats.overdueCount} waiting more than 48 hours`
                : `${stats.overdueCount} طلب بانتظار أكثر من 48 ساعة`}
            </p>
          </div>
          <Chevron className="h-5 w-5 shrink-0 opacity-70" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/pricing" className="pricer-action-card pricer-action-card--queue">
          <span className="pricer-action-icon">
            <DollarSign className="h-6 w-6" />
          </span>
          <p className="text-sm font-black text-brand mt-3">{t("pendingPricing", locale)}</p>
          <p className="text-2xl font-black text-accent tabular-nums mt-1">{stats.pendingCount}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {locale === "en" ? "Open queue" : "فتح قائمة الانتظار"}
          </p>
        </Link>
        <Link href="/priced" className="pricer-action-card pricer-action-card--done">
          <span className="pricer-action-icon pricer-action-icon--green">
            <ClipboardCheck className="h-6 w-6" />
          </span>
          <p className="text-sm font-black text-brand mt-3">{t("myPricedOrders", locale)}</p>
          <p className="text-2xl font-black text-emerald-600 tabular-nums mt-1">
            {stats.myPricedCount}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {locale === "en" ? "View history" : "عرض السجل"}
          </p>
        </Link>
      </div>

      <section>
        <SectionTitle
          title={locale === "en" ? "Pricing Queue" : "قائمة التسعير"}
          action={
            stats.pendingCount > 0 ? (
              <Link href="/pricing" className="text-xs font-semibold text-accent flex items-center gap-1">
                {locale === "en" ? "View all" : "عرض الكل"}
                <Chevron className="h-3.5 w-3.5" />
              </Link>
            ) : undefined
          }
        />
        <div className="card-list-grid">
          {stats.recentQueue.length === 0 ? (
            <PricerEmptyState
              icon={PartyPopper}
              locale={locale}
              title={locale === "en" ? "All caught up!" : "أحسنت!"}
              message={
                locale === "en"
                  ? "No orders waiting right now"
                  : "لا طلبات معلقة حالياً"
              }
              actionHref="/priced"
              actionLabel={locale === "en" ? "View my priced" : "عرض ما سعّرتُ"}
            />
          ) : (
            stats.recentQueue.map((item) => (
              <PricingQueueCard key={item.id} item={item} locale={locale} />
            ))
          )}
        </div>
      </section>

      {stats.recentPriced.length > 0 && (
        <section>
          <SectionTitle
            title={locale === "en" ? "Recently Priced" : "آخر ما سعّرت"}
            action={
              <Link href="/priced" className="text-xs font-semibold text-accent flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                {locale === "en" ? "All" : "الكل"}
              </Link>
            }
          />
          <div className="card-list-grid">
            {stats.recentPriced.map((item) => (
              <PricingQueueCard
                key={item.id}
                item={item}
                locale={locale}
                href={`/priced/${item.id}`}
                variant="done"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
