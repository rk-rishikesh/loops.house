"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { CACHE_CONFIG } from "@/lib/cache-config";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: CACHE_CONFIG,
    },
  });
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
