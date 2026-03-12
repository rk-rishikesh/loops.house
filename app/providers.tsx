"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CACHE_CONFIG } from "@/lib/cache-config";
import type { User, Session } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ClientCapabilities {
  isAdmin: boolean;
  isEventCreator: boolean;
  isCohost: boolean;
  isJudge: boolean;
}

function getCapsHint(): ClientCapabilities | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)x-user-caps-hint=([^;]+)/);
  if (!match?.[1]) return null;
  const [admin, ec, cohost, judge] = match[1].split(",");
  return {
    isAdmin: admin === "1",
    isEventCreator: ec === "1",
    isCohost: cohost === "1",
    isJudge: judge === "1",
  };
}

type AuthState = {
  user: User | null;
  session: Session | null;
  capabilities: ClientCapabilities | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  capabilities: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchCaps(
  supabase: SupabaseClient,
  userId: string,
): Promise<ClientCapabilities | null> {
  const [userResult, cohostResult, judgeResult] = await Promise.all([
    supabase
      .from("users")
      .select("is_admin, is_event_creator")
      .eq("id", userId)
      .single(),
    supabase
      .from("hackathon_cohosts")
      .select("hackathon_id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("hackathon_judges")
      .select("hackathon_id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);
  if (!userResult.data) return null;
  return {
    isAdmin: userResult.data.is_admin,
    isEventCreator: userResult.data.is_event_creator,
    isCohost: (cohostResult.count ?? 0) > 0,
    isJudge: (judgeResult.count ?? 0) > 0,
  };
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    capabilities: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();
    let lastUserId: string | null = null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      if (user?.id === lastUserId && lastUserId !== null) {
        setState((prev) => ({ ...prev, session, user, loading: false }));
        return;
      }
      lastUserId = user?.id ?? null;

      if (!user) {
        setState({
          user: null,
          session: null,
          capabilities: null,
          loading: false,
        });
        return;
      }

      const hint = getCapsHint();
      if (hint) {
        setState({ user, session, capabilities: hint, loading: false });
        fetchCaps(supabase, user.id).then((dbCaps) => {
          if (
            dbCaps &&
            (dbCaps.isAdmin !== hint.isAdmin ||
              dbCaps.isEventCreator !== hint.isEventCreator ||
              dbCaps.isCohost !== hint.isCohost ||
              dbCaps.isJudge !== hint.isJudge)
          ) {
            setState((prev) => ({ ...prev, capabilities: dbCaps }));
          }
        });
      } else {
        const caps = await fetchCaps(supabase, user.id);
        setState({ user, session, capabilities: caps, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: CACHE_CONFIG,
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
