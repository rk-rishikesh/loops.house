import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".loops");
const CREDENTIALS_FILE = join(CONFIG_DIR, "credentials.json");

export interface Credentials {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

function ensureDir() {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
}

export function saveCredentials(creds: Credentials) {
  ensureDir();
  writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), "utf-8");
}

export function loadCredentials(): Credentials | null {
  if (!existsSync(CREDENTIALS_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CREDENTIALS_FILE, "utf-8"));
  } catch {
    return null;
  }
}

export function clearCredentials() {
  if (existsSync(CREDENTIALS_FILE)) {
    writeFileSync(CREDENTIALS_FILE, "{}", "utf-8");
  }
}

const SUPABASE_URL = "https://xhcflmioqsoncfeoxpiy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoY2ZsbWlvcXNvbmNmZW94cGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDMzNDEsImV4cCI6MjA4ODgxOTM0MX0.rMMgKYcNGGYG8hslVmRj7S0mDJLia_gauxja0SRocc4";

export function getSupabaseUrl(): string {
  return SUPABASE_URL;
}

export function getAnonKey(): string {
  return SUPABASE_ANON_KEY;
}
