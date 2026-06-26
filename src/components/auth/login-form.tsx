"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/ui/app-logo";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DEMO_ACCOUNTS = [
  {
    email: "taker@modernitygate.com",
    roleAr: "مدخل الطلبات",
    roleEn: "Order Taker",
    color: "border-blue-200/80 bg-blue-50/80 hover:border-blue-300",
  },
  {
    email: "pricer@modernitygate.com",
    roleAr: "المسعّر",
    roleEn: "Pricer",
    color: "border-amber-200/80 bg-amber-50/80 hover:border-amber-300",
  },
  {
    email: "manager@modernitygate.com",
    roleAr: "المدير",
    roleEn: "Manager",
    color: "border-emerald-200/80 bg-emerald-50/80 hover:border-emerald-300",
  },
] as const;

const DEMO_PASSWORD = "123456";

type LoginFormProps = {
  showDemoAccounts?: boolean;
  buildId?: string;
};

export function LoginForm({ showDemoAccounts = true, buildId }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loginWithCredentials(accountEmail: string, accountPassword: string) {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: accountEmail,
      password: accountPassword,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t("loginError", "ar"));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await loginWithCredentials(email, password);
  }

  async function loginDemo(accountEmail: string) {
    setEmail(accountEmail);
    setPassword(DEMO_PASSWORD);
    await loginWithCredentials(accountEmail, DEMO_PASSWORD);
  }

  return (
    <div className="login-screen">
      {/* Hero — brand panel */}
      <div className="login-hero">
        <div className="login-hero-grid" aria-hidden />
        <div className="relative z-10 max-w-md mx-auto md:max-w-none md:text-center">
          <div className="flex items-center gap-4 md:flex-col md:gap-6">
            <div className="login-logo-badge w-[80px] h-[80px] md:w-[104px] md:h-[104px] flex items-center justify-center shrink-0">
              <AppLogo size={96} className="w-full h-full" priority />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1 hidden md:block">
                Modernity Gate
              </p>
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                بوابة الحداثة
              </h1>
              <p className="text-sm md:text-base text-white/55 mt-1.5 md:mt-2 leading-relaxed">
                Modernity Gate for General Trading
              </p>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center gap-4 mt-12">
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>إدارة طلبات الاستيراد من الصين</span>
            </div>
            <div className="flex gap-3 mt-2">
              {["استلام", "تسعير", "فواتير", "أرشيف"].map((step) => (
                <span
                  key={step}
                  className="text-xs font-semibold text-white/70 bg-white/8 border border-white/10 rounded-full px-3.5 py-1.5"
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="login-body px-5 pb-[max(24px,env(safe-area-inset-bottom))] md:px-10">
        <div className="login-card animate-slide-up p-6 md:p-0 max-w-md mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-11 h-11 rounded-2xl stat-glow flex items-center justify-center shadow-lg shadow-accent/25 shrink-0">
              <Lock className="h-5 w-5 text-white" />
            </span>
            <div>
              <h2 className="text-lg font-black text-brand">{t("login", "ar")}</h2>
              <p className="text-xs text-gray-400">Sign in to your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                id="email"
                type="email"
                label={t("email", "ar")}
                placeholder="email@modernitygate.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                dir="ltr"
                className="pe-11"
              />
              <Mail className="absolute end-4 top-[38px] h-4 w-4 text-gray-300 pointer-events-none" />
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                label={t("password", "ar")}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                dir="ltr"
                className="pe-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-[36px] w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-brand hover:bg-[var(--field-bg)] transition-colors"
                aria-label={showPassword ? "إخفاء" : "إظهار"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-2xl bg-red-50 border border-red-200/80 px-4 py-3 text-sm text-red-700 flex items-start gap-2.5 animate-fade-in"
              >
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 text-xs font-bold">
                  !
                </span>
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" disabled={loading} className="mt-2">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("signingIn", "ar")}
                </>
              ) : (
                <>
                  {t("login", "ar")}
                  <ArrowLeft className="h-5 w-5 rotate-180" />
                </>
              )}
            </Button>
          </form>
        </div>

        {showDemoAccounts && (
          <div className="mt-5 max-w-md mx-auto w-full animate-fade-in">
            <div className="rounded-2xl border border-border bg-white/80 backdrop-blur-sm p-4">
              <p className="font-bold text-brand text-sm mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                حسابات تجريبية
                <span className="text-[10px] font-normal text-gray-400 ms-auto" dir="ltr">
                  DEV
                </span>
              </p>
              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() => loginDemo(acc.email)}
                    className={cn(
                      "login-dev-chip w-full text-start rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-2",
                      acc.color
                    )}
                  >
                    <span className="text-sm font-bold text-brand">{acc.roleAr}</span>
                    <span className="text-[10px] font-mono text-gray-400 truncate" dir="ltr">
                      {acc.email}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">
                كلمة المرور:{" "}
                <span className="font-mono font-bold text-accent" dir="ltr">
                  {DEMO_PASSWORD}
                </span>
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400 mt-6 max-w-md mx-auto">
          © {new Date().getFullYear()} بوابة الحداثة للتجارة العامة
          {buildId && (
            <span className="block mt-1 font-mono text-[10px] text-gray-300" dir="ltr">
              build {buildId}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
