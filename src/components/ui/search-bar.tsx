"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState, useTransition } from "react";
import { t, type Locale } from "@/lib/i18n";

export function SearchBar({ locale }: { locale: Locale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const initial = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initial);

  const applySearch = useCallback(
    (value: string) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value.trim()) params.set("q", value.trim());
        else params.delete("q");
        router.replace(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (query === initial) return;
    const timer = setTimeout(() => applySearch(query), 350);
    return () => clearTimeout(timer);
  }, [query, initial, applySearch]);

  return (
    <div className="relative">
      <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      <input
        type="search"
        placeholder={t("searchPlaceholder", locale)}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={`field-input ps-11 pe-20 ${pending ? "opacity-70" : ""}`}
      />
      <div className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
            aria-label={locale === "en" ? "Clear" : "مسح"}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <Button
          size="sm"
          onClick={() => applySearch(query)}
          disabled={pending}
          className="min-h-[36px] px-3"
        >
          {t("search", locale)}
        </Button>
      </div>
    </div>
  );
}

export function StatusFilter({
  locale,
  current,
  options,
}: {
  locale: Locale;
  current?: string;
  options: { value: string; labelAr: string; labelEn: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setStatus(status?: string) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (status) params.set("status", status);
      else params.delete("status");
      router.replace(`?${params.toString()}`);
    });
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => setStatus()}
        className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
          !current
            ? "bg-brand text-white shadow-md shadow-brand/20"
            : "bg-white border border-border text-gray-500 hover:border-gray-300"
        }`}
      >
        {locale === "en" ? "All" : "الكل"}
      </button>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setStatus(opt.value)}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            current === opt.value
              ? "bg-brand text-white shadow-md shadow-brand/20"
              : "bg-white border border-border text-gray-500 hover:border-gray-300"
          }`}
        >
          {locale === "en" ? opt.labelEn : opt.labelAr}
        </button>
      ))}
    </div>
  );
}
