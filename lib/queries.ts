"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjects,
  getHackathons,
  getTeams,
  getProject,
  getHackathon,
  getHackathonSubmissions,
  getSubmissionsForHackathons,
  saveTeam,
  saveProject,
  saveHackathon,
  submitProjectToHackathon,
} from "@/lib/storage";
import type { StoredProject, StoredHackathon, StoredTeam, StoredSubmission } from "@/lib/storage";
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
  hackathons: {
    all: ["hackathons"] as const,
    list: () => ["hackathons", "list"] as const,
    detail: (id: string) => ["hackathons", "detail", id] as const,
  },
  teams: {
    all: ["teams"] as const,
    list: (userId?: string) => ["teams", "list", userId] as const,
  },
  submissions: {
    forHackathon: (hackathonId: string) => ["submissions", "hackathon", hackathonId] as const,
    forHackathons: (hackathonIds: string[]) => ["submissions", "hackathons", hackathonIds] as const,
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

export function useHackathons() {
  const { loading } = useAuth();
  return useQuery<StoredHackathon[]>({
    queryKey: queryKeys.hackathons.list(),
    queryFn: () => getHackathons(),
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

export function useHackathon(id: string) {
  const { loading } = useAuth();
  return useQuery<StoredHackathon | null>({
    queryKey: queryKeys.hackathons.detail(id),
    queryFn: () => getHackathon(id),
    enabled: !loading && !!id,
  });
}

export function useSubmissions(hackathonId?: string) {
  const { loading } = useAuth();
  return useQuery<StoredSubmission[]>({
    queryKey: queryKeys.submissions.forHackathon(hackathonId ?? ""),
    queryFn: () => getHackathonSubmissions(hackathonId!),
    enabled: !loading && !!hackathonId,
  });
}

export function useSubmissionsForHackathons(hackathonIds: string[]) {
  const { loading } = useAuth();
  return useQuery<StoredSubmission[]>({
    queryKey: queryKeys.submissions.forHackathons(hackathonIds),
    queryFn: () => getSubmissionsForHackathons(hackathonIds),
    enabled: !loading && hackathonIds.length > 0,
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

export function useSubmitProject(hackathonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, projectId }: { teamId: string; projectId: string }) =>
      submitProjectToHackathon(hackathonId, teamId, projectId),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: queryKeys.submissions.forHackathon(hackathonId) });
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

export function useSaveHackathon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hackathon: Parameters<typeof saveHackathon>[0]) => saveHackathon(hackathon),
    onSuccess: () => {
      queryClient.refetchQueries({ predicate: (q) => q.queryKey[0] === "hackathons" });
      queryClient.refetchQueries({ predicate: (q) => q.queryKey[0] === "submissions" });
    },
  });
}
