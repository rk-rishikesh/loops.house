"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjects,
  getBoosters,
  getTeams,
  getProject,
  getBooster,
  getBoosterSubmissions,
  getSubmissionsForBoosters,
  saveTeam,
  submitProjectToBooster,
} from "@/lib/storage";
import type { StoredProject, StoredBooster, StoredTeam, StoredSubmission, BoosterType } from "@/lib/storage";
import { getRole } from "@/lib/auth";
import type { AppRole } from "@/lib/auth";

// --- Query key factory ---

export const queryKeys = {
  projects: {
    all: ["projects"] as const,
    list: (teamId?: string) => ["projects", "list", teamId] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
  },
  boosters: {
    all: ["boosters"] as const,
    list: (type?: BoosterType) => ["boosters", "list", type] as const,
    detail: (id: string) => ["boosters", "detail", id] as const,
  },
  teams: {
    all: ["teams"] as const,
    list: (userId?: string) => ["teams", "list", userId] as const,
  },
  submissions: {
    forBooster: (boosterId: string) => ["submissions", "booster", boosterId] as const,
    forBoosters: (boosterIds: string[]) => ["submissions", "boosters", boosterIds] as const,
  },
  role: ["role"] as const,
};

// --- Hooks ---

export function useProjects(teamId?: string) {
  return useQuery<StoredProject[]>({
    queryKey: queryKeys.projects.list(teamId),
    queryFn: () => getProjects(),
  });
}

export function useBoosters(type?: BoosterType) {
  return useQuery<StoredBooster[]>({
    queryKey: queryKeys.boosters.list(type),
    queryFn: async () => {
      const all = await getBoosters();
      if (!type) return all;
      return all.filter((b) => (b.booster_type ?? "idea") === type);
    },
  });
}

export function useTeams(userId?: string) {
  return useQuery<StoredTeam[]>({
    queryKey: queryKeys.teams.list(userId),
    queryFn: () => getTeams(userId),
    enabled: userId !== undefined,
  });
}

export function useProject(id: string) {
  return useQuery<StoredProject | null>({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => getProject(id),
    enabled: !!id,
  });
}

export function useBooster(id: string) {
  return useQuery<StoredBooster | null>({
    queryKey: queryKeys.boosters.detail(id),
    queryFn: () => getBooster(id),
    enabled: !!id,
  });
}

export function useSubmissions(boosterId?: string) {
  return useQuery<StoredSubmission[]>({
    queryKey: queryKeys.submissions.forBooster(boosterId ?? ""),
    queryFn: () => getBoosterSubmissions(boosterId!),
    enabled: !!boosterId,
  });
}

export function useSubmissionsForBoosters(boosterIds: string[]) {
  return useQuery<StoredSubmission[]>({
    queryKey: queryKeys.submissions.forBoosters(boosterIds),
    queryFn: () => getSubmissionsForBoosters(boosterIds),
    enabled: boosterIds.length > 0,
  });
}

export function useRole() {
  return useQuery<AppRole | null>({
    queryKey: queryKeys.role,
    queryFn: () => getRole(),
    staleTime: 5 * 60_000, // roles change rarely — 5min stale
  });
}

// --- Mutation hooks ---

export function useSaveTeam(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      saveTeam({ name: data.name, owner_id: userId!, created_at: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.list(userId) });
    },
  });
}

export function useSubmitProject(boosterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, projectId }: { teamId: string; projectId: string }) =>
      submitProjectToBooster(boosterId, teamId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.forBooster(boosterId) });
    },
  });
}
