import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function signInWithOAuth(provider: "google" | "github", redirect?: string) {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  if (redirect) {
    callbackUrl.searchParams.set("redirect", redirect);
  }
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function isLoggedIn(): Promise<boolean> {
  const user = await getUser();
  return user !== null;
}
