"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Github } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  signInWithOAuth,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/supabase/types";
import { loginSchema, type LoginSchema } from "@/lib/validations/schemas";
import { useAuth } from "@/app/providers";

const ROLE_DASHBOARDS: Record<AppRole, string> = {
  builder: "/builder",
  host: "/host",
  viewer: "/boosters",
  judge: "/host/judging",
  admin: "/admin",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const { user, role, loading: authLoading } = useAuth();

  const explicitRedirect = searchParams.get("redirect");

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (!authLoading && user && role) {
      router.replace(explicitRedirect ?? ROLE_DASHBOARDS[role]);
    }
  }, [authLoading, user, role, router, explicitRedirect]);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [oauthLoading, setOauthLoading] = useState(false);
  const [serverError, setServerError] = useState(
    authError === "auth_failed" ? "Authentication failed. Please try again." : "",
  );
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  async function handleOAuth(provider: "google" | "github") {
    setServerError("");
    setOauthLoading(true);
    const { error } = await signInWithOAuth(provider, explicitRedirect ?? undefined);
    if (error) {
      setServerError(error.message);
      setOauthLoading(false);
    }
  }

  const loading = isSubmitting || oauthLoading;

  const onSubmit = async (data: LoginSchema) => {
    setServerError("");
    setMessage("");

    if (mode === "signup") {
      const { error } = await signUpWithEmail(data.email, data.password);
      if (error) {
        setServerError(error.message);
      } else {
        setMessage("Check your email for a confirmation link.");
      }
    } else {
      const { data: authData, error } = await signInWithEmail(data.email, data.password);
      if (error) {
        setServerError(error.message);
      } else {
        if (explicitRedirect) {
          router.push(explicitRedirect);
        } else {
          const userId = authData.user?.id;
          let role: AppRole | null = null;
          if (userId) {
            const supabase = createClient();
            const { data: row } = await supabase
              .from("users")
              .select("role")
              .eq("id", userId)
              .single();
            role = (row?.role as AppRole) ?? null;
          }
          router.push(role ? ROLE_DASHBOARDS[role] : "/builder");
        }
      }
    }
  };

  // Don't render the form while the auth state is loading or a redirect is pending
  if (authLoading || (!authLoading && user && role)) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />;
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-12 max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to portal
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400 text-sm">
          {mode === "signin"
            ? "Sign in to access your dashboard."
            : "Create an account to get started."}
        </p>

        {/* OAuth */}
        <div className="mt-8 space-y-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleOAuth("google")}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium text-zinc-900 dark:text-white disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleOAuth("github")}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium text-zinc-900 dark:text-white disabled:opacity-50"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-zinc-50 dark:bg-zinc-950 px-2 text-zinc-500">
              or continue with email
            </span>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          {serverError && <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>}
          {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("signup"); setServerError(""); setMessage(""); }}
                className="text-violet-600 dark:text-violet-400 hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("signin"); setServerError(""); setMessage(""); }}
                className="text-violet-600 dark:text-violet-400 hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
