import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const [auth, params] = await Promise.all([getServerAuth(), searchParams]);

  if (auth) {
    const dest = params.redirect ?? (auth.capabilities.isAdmin ? "/admin" : "/dashboard");
    redirect(dest);
  }

  return <LoginForm authError={params.error} explicitRedirect={params.redirect} />;
}
