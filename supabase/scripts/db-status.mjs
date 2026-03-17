#!/usr/bin/env node
import { readFileSync } from "node:fs";
/**
 * Check the current state of your Supabase database.
 * Usage: node supabase/scripts/db-status.mjs
 */
import { createClient } from "@supabase/supabase-js";

// Parse .env
const env = {};
readFileSync(".env", "utf-8")
  .split("\n")
  .forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  });

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

console.log(`Supabase URL: ${url}`);
console.log("");

const client = createClient(url, key);

// Check tables
const tables = [
  "users",
  "teams",
  "team_members",
  "loops_profiles",
  "knowledge_bases",
  "hackathons",
  "submissions",
  "invitations",
  "hackathon_cohosts",
  "hackathon_judges",
  "rate_limits",
];

console.log("=== Tables ===");
let allTablesOk = true;
for (const table of tables) {
  const { error } = await client.from(table).select("*", { count: "exact", head: true });
  if (error) {
    console.log(`  [MISSING] ${table} — ${error.message}`);
    allTablesOk = false;
  } else {
    const { count } = await client.from(table).select("*", { count: "exact", head: true });
    console.log(`  [OK]      ${table} (${count ?? 0} rows)`);
  }
}

// Check RPC functions
console.log("\n=== RPC Functions ===");
const rpcs = [
  {
    name: "check_rate_limit",
    args: { p_key: "__health_check__", p_max_requests: 999, p_window_ms: 3600000 },
  },
];

let allFunctionsOk = true;
for (const rpc of rpcs) {
  const { error } = await client.rpc(rpc.name, rpc.args);
  if (error) {
    console.log(`  [MISSING] ${rpc.name}`);
    allFunctionsOk = false;
  } else {
    console.log(`  [OK]      ${rpc.name}`);
  }
}

// Clean up health check rate limit entry
await client.from("rate_limits").delete().eq("key", "__health_check__");

// Check storage buckets
console.log("\n=== Storage Buckets ===");
let allBucketsOk = true;
const expectedBuckets = ["project-assets", "hackathon-assets", "user-avatars"];
const { data: buckets, error: bucketsErr } = await client.storage.listBuckets();
if (bucketsErr) {
  console.log(`  Error: ${bucketsErr.message}`);
  allBucketsOk = false;
} else {
  const bucketNames = new Set(buckets?.map((b) => b.name) || []);
  for (const name of expectedBuckets) {
    if (bucketNames.has(name)) {
      const b = buckets.find((b) => b.name === name);
      console.log(`  [OK]      ${name} (public: ${b.public})`);
    } else {
      console.log(`  [MISSING] ${name}`);
      allBucketsOk = false;
    }
  }
}

// Summary
console.log("\n=== Summary ===");
const issues = [];
if (!allTablesOk) issues.push("tables");
if (!allFunctionsOk) issues.push("RPC functions");
if (!allBucketsOk) issues.push("storage buckets");

if (issues.length === 0) {
  console.log("All checks passed. Database is fully set up.");
} else {
  console.log(`Issues found: ${issues.join(", ")}`);
  console.log("");
  if (!allTablesOk || !allFunctionsOk) {
    console.log("To fix, run the SQL migrations:");
    console.log("  Option A: npx supabase login && npx supabase link && npx supabase db push");
    console.log(
      "  Option B: Copy SQL from supabase/migrations/ into the Supabase Dashboard SQL Editor",
    );
    if (!allFunctionsOk && allTablesOk) {
      console.log(
        "  (Tables exist but functions are missing — run supabase/migrations/003_functions.sql)",
      );
    }
  }
  if (!allBucketsOk) {
    console.log("  To create storage buckets: node supabase/scripts/setup-storage.mjs");
  }
}
