"use client";

import { useSyncExternalStore } from "react";
import type { HackathonPhase } from "@/lib/hackathon-phase";

export interface HackathonTabOverride {
  phase: HackathonPhase;
  hasSubmission: boolean;
}

// Module-level state + listeners (same pattern as use-collapsed.ts)
let _override: HackathonTabOverride | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((cb) => cb());
}

export function setHackathonTabOverride(data: HackathonTabOverride | null) {
  _override = data;
  emit();
}

function getSnapshot() {
  return _override;
}

function getServerSnapshot() {
  return null;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useHackathonTabs(): HackathonTabOverride | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
