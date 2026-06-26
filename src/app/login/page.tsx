import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const showDemoAccounts =
    process.env.SHOW_DEMO_ACCOUNTS === "true" ||
    process.env.NODE_ENV === "development";

  return <LoginForm showDemoAccounts={showDemoAccounts} />;
}
