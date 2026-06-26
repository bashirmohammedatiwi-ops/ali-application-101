import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const showDemoAccounts = process.env.SHOW_DEMO_ACCOUNTS !== "false";

  return <LoginForm showDemoAccounts={showDemoAccounts} />;
}
