import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/ui/app-logo";
import { Home } from "lucide-react";
import { t } from "@/lib/i18n";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 app-bg">
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-lg mb-6 p-4">
          <AppLogo size={56} className="w-full h-full opacity-90" />
        </div>
        <p className="text-6xl font-black text-brand/10 mb-2">404</p>
        <h1 className="text-xl font-bold text-brand mb-2">{t("pageNotFound", "ar")}</h1>
        <p className="text-gray-400 text-sm mb-8">{t("pageNotFound", "en")}</p>
        <Link href="/dashboard">
          <Button size="lg">
            <Home className="h-5 w-5" />
            {t("home", "ar")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
