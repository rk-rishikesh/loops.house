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
  saveProject,
  saveBooster,
  submitProjectToBooster,
} from "@/lib/storage";
import type { StoredProject, StoredBooster, StoredTeam, StoredSubmission, BoosterType } from "@/lib/storage";
import { getRole } from "@/lib/auth";
import type { AppRole } from "@/lib/auth";
import { useAuth } from "@/app/providers";

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
  const { loading } = useAuth();
  return useQuery<StoredProject[]>({
    queryKey: queryKeys.projects.list(teamId),
    queryFn: () => getProjects(),
    enabled: !loading,
  });
}

export function useBoosters(type?: BoosterType) {
  const { loading } = useAuth();
  return useQuery<StoredBooster[]>({
    queryKey: queryKeys.boosters.list(type),
    queryFn: async () => {
      const all = await getBoosters();
      if (!type) return all;
      return all.filter((b) => (b.booster_type ?? "idea") === type);
    },
    enabled: !loading,
  });
}

export function useTeams(userId?: string) {
  const { loading } = useAuth();
  return useQuery<StoredTeam[]>({
    queryKey: queryKeys.teams.list(userId),
    queryFn: () => getTeams(userId),
    enabled: !loading && userId !== undefined,
  });
}

export function useProject(id: string) {
  const { loading } = useAuth();
  return useQuery<StoredProject | null>({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => getProject(id),
    enabled: !loading && !!id,
  });
}

export function useBooster(id: string) {
  const { loading } = useAuth();
  return useQuery<StoredBooster | null>({
    queryKey: queryKeys.boosters.detail(id),
    queryFn: () => getBooster(id),
    enabled: !loading && !!id,
  });
}

export function useSubmissions(boosterId?: string) {
  const { loading } = useAuth();
  return useQuery<StoredSubmission[]>({
    queryKey: queryKeys.submissions.forBooster(boosterId ?? ""),
    queryFn: () => getBoosterSubmissions(boosterId!),
    enabled: !loading && !!boosterId,
  });
}

export function useSubmissionsForBoosters(boosterIds: string[]) {
  const { loading } = useAuth();
  return useQuery<StoredSubmission[]>({
    queryKey: queryKeys.submissions.forBoosters(boosterIds),
    queryFn: () => getSubmissionsForBoosters(boosterIds),
    enabled: !loading && boosterIds.length > 0,
  });
}

export function useRole() {
  const { user, loading } = useAuth();
  return useQuery<AppRole | null>({
    queryKey: queryKeys.role,
    queryFn: () => getRole(user!.id),
    enabled: !loading && !!user,
  });
}

// --- Mutation hooks ---

export function useSaveTeam(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      saveTeam({ name: data.name, owner_id: userId!, created_at: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: queryKeys.teams.list(userId) });
    },
  });
}

export function useSubmitProject(boosterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, projectId }: { teamId: string; projectId: string }) =>
      submitProjectToBooster(boosterId, teamId, projectId),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: queryKeys.submissions.forBooster(boosterId) });
      queryClient.refetchQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useSaveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: Parameters<typeof saveProject>[0]) => saveProject(project),
    onSuccess: (_data, variables) => {
      queryClient.refetchQueries({ queryKey: queryKeys.projects.all });
      queryClient.refetchQueries({ queryKey: queryKeys.projects.list() });
      if (variables.project_id) {
        queryClient.refetchQueries({ queryKey: queryKeys.projects.detail(variables.project_id) });
      }
      queryClient.refetchQueries({ predicate: (q) => q.queryKey[0] === "submissions" });
    },
  });
}

export function useSaveBooster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (booster: Parameters<typeof saveBooster>[0]) => saveBooster(booster),
    onSuccess: () => {
      queryClient.refetchQueries({ predicate: (q) => q.queryKey[0] === "boosters" });
      queryClient.refetchQueries({ predicate: (q) => q.queryKey[0] === "submissions" });
    },
  });
}
