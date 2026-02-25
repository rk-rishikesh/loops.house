"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { User, Session } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type AuthState = {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  role: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppRole | null> {
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return (data?.role as AppRole) ?? null;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();
    let lastUserId: string | null = null;

    // onAuthStateChange fires INITIAL_SESSION on setup, so no separate
    // loadSession() call is needed. This eliminates a duplicate getSession +
    // fetchRole cycle that was doubling network calls on every page load.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      // Skip redundant fetch if same user (e.g. token refresh)
      if (user?.id === lastUserId && lastUserId !== null) {
        setState((prev) => ({ ...prev, session, user, loading: false }));
        return;
      }
      lastUserId = user?.id ?? null;
      const role = user ? await fetchRole(supabase, user.id) : null;
      setState({ user, session, role, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 300_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
