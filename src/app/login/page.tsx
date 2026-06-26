import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const buildId = process.env.APP_BUILD_ID ?? "dev";

  return <LoginForm showDemoAccounts buildId={buildId} />;
}
