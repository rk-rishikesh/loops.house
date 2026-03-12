/**
 * Centralized TanStack Query cache configuration.
 * Single source of truth — flip staleTime back to production values post-demo.
 */
export const CACHE_CONFIG = {
  staleTime: 5_000, // 30s — data considered fresh, prevents re-fetch on every navigation
  gcTime: 300_000, // 5 min garbage collection keeps cache for back/forward
  refetchOnMount: true, // refetch only when stale (not on every mount)
  refetchOnWindowFocus: true,
} as const;
