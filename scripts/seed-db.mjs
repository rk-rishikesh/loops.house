#!/usr/bin/env node

/**
 * LoopsFlow Database Seeder
 *
 * Clears all data and inserts test users (one per role), sample boosters,
 * teams, projects, submissions, and booster tracks.
 *
 * Uses the Supabase Admin API (service role key) to create auth users
 * and bypass RLS for all inserts.
 *
 * Usage:
 *   node scripts/seed-db.mjs
 *   npm run db:seed
 *
 * Environment: reads from .env in project root
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Load environment
// ---------------------------------------------------------------------------
function loadEnv() {
  try {
    const content = readFileSync(resolve(ROOT, ".env"), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env missing is fine if vars are already set
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Stable UUIDs for deterministic seeding (regenerate with randomUUID() if needed)
// ---------------------------------------------------------------------------
const IDS = {
  // Users
  builder_user: "a0000000-0000-0000-0000-000000000001",
  host_user: "a0000000-0000-0000-0000-000000000002",
  viewer_user: "a0000000-0000-0000-0000-000000000003",
  admin_user: "a0000000-0000-0000-0000-000000000004",
  judge_user: "a0000000-0000-0000-0000-000000000005",
  builder2_user: "a0000000-0000-0000-0000-000000000006",

  // Teams
  team_alpha: "b0000000-0000-0000-0000-000000000001",
  team_beta: "b0000000-0000-0000-0000-000000000002",

  // Projects (loops_profiles)
  project_defi: "c0000000-0000-0000-0000-000000000001",
  project_nft: "c0000000-0000-0000-0000-000000000002",
  project_social: "c0000000-0000-0000-0000-000000000003",

  // Boosters
  booster_idea: "d0000000-0000-0000-0000-000000000001",
  booster_momentum: "d0000000-0000-0000-0000-000000000002",
  booster_capital: "d0000000-0000-0000-0000-000000000003",

  // Booster tracks
  track_eth: "e0000000-0000-0000-0000-000000000001",
  track_pol: "e0000000-0000-0000-0000-000000000002",
  track_arb: "e0000000-0000-0000-0000-000000000003",

  // Submissions
  sub_defi_idea: "f0000000-0000-0000-0000-000000000001",
  sub_nft_idea: "f0000000-0000-0000-0000-000000000002",
  sub_social_momentum: "f0000000-0000-0000-0000-000000000003",

  // Knowledge bases
  kb_defi: "00000000-ab00-0000-0000-000000000001",
  kb_nft: "00000000-ab00-0000-0000-000000000002",
};

// ---------------------------------------------------------------------------
// Test user credentials
// ---------------------------------------------------------------------------
const TEST_USERS = [
  {
    id: IDS.builder_user,
    email: "builder@loopsflow.test",
    password: "Builder123!",
    role: "builder",
    display_name: "Alice Builder",
    username: "alice_builder",
  },
  {
    id: IDS.builder2_user,
    email: "builder2@loopsflow.test",
    password: "Builder2123!",
    role: "builder",
    display_name: "Dave Builder",
    username: "dave_builder",
  },
  {
    id: IDS.host_user,
    email: "host@loopsflow.test",
    password: "Host123!",
    role: "host",
    display_name: "Bob Host",
    username: "bob_host",
  },
  {
    id: IDS.viewer_user,
    email: "viewer@loopsflow.test",
    password: "Viewer123!",
    role: "viewer",
    display_name: "Carol Viewer",
    username: "carol_viewer",
  },
  {
    id: IDS.admin_user,
    email: "admin@loopsflow.test",
    password: "Admin123!",
    role: "admin",
    display_name: "Eve Admin",
    username: "eve_admin",
  },
  {
    id: IDS.judge_user,
    email: "judge@loopsflow.test",
    password: "Judge123!",
    role: "judge",
    display_name: "Frank Judge",
    username: "frank_judge",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function check(label, result) {
  if (result.error) {
    console.error(`  [FAIL] ${label}:`, result.error.message);
    return false;
  }
  console.log(`  [OK]   ${label}`);
  return true;
}

// ---------------------------------------------------------------------------
// Step 1: Clear all data
// ---------------------------------------------------------------------------
async function clearAll() {
  console.log("\n--- Clearing all data ---");

  // Delete in dependency order (children first)
  const tables = [
    "rate_limits",
    "booster_track_chunks",
    "knowledge_base_chunks",
    "knowledge_bases",
    "submissions",
    "judge_invites",
    "host_applications",
    "booster_tracks",
    "loops_profiles",
    "team_members",
    "teams",
    "boosters",
    "users",
  ];

  for (const table of tables) {
    // neq with a non-existent value effectively means "delete all"
    const { error } = await supabase
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error && !error.message.includes("0 rows")) {
      // rate_limits uses 'key' PK not 'id'
      if (table === "rate_limits") {
        const { error: e2 } = await supabase
          .from(table)
          .delete()
          .neq("key", "__nonexistent__");
        if (e2) console.error(`  [WARN] ${table}:`, e2.message);
        else console.log(`  [OK]   Cleared ${table}`);
        continue;
      }
      // team_members uses composite PK
      if (table === "team_members") {
        const { error: e2 } = await supabase
          .from(table)
          .delete()
          .neq("user_id", "00000000-0000-0000-0000-000000000000");
        if (e2) console.error(`  [WARN] ${table}:`, e2.message);
        else console.log(`  [OK]   Cleared ${table}`);
        continue;
      }
      console.error(`  [WARN] ${table}:`, error.message);
    } else {
      console.log(`  [OK]   Cleared ${table}`);
    }
  }

  // Delete auth users
  console.log("  Clearing auth.users...");
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  if (authUsers?.users) {
    for (const u of authUsers.users) {
      await supabase.auth.admin.deleteUser(u.id);
    }
    console.log(`  [OK]   Cleared ${authUsers.users.length} auth users`);
  }
}

// ---------------------------------------------------------------------------
// Step 2: Create auth users + public.users rows
// ---------------------------------------------------------------------------
async function seedUsers() {
  console.log("\n--- Seeding users ---");

  for (const u of TEST_USERS) {
    // Hash the password before sending to Supabase
    const passwordHash = bcrypt.hashSync(u.password, 10);

    // Create in auth.users
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password_hash: passwordHash,
      email_confirm: true,
      user_metadata: { full_name: u.display_name },
    });

    if (error) {
      console.error(`  [FAIL] Auth user ${u.email}:`, error.message);
      continue;
    }

    const authId = data.user.id;
    console.log(`  [OK]   Auth user ${u.email} (${authId})`);

    // The trigger handle_new_user() auto-creates public.users with role='builder'.
    // We need to update the role and other fields.
    const updateResult = await supabase
      .from("users")
      .update({
        role: u.role,
        display_name: u.display_name,
        username: u.username,
      })
      .eq("id", authId);

    check(`  Updated role to '${u.role}' for ${u.email}`, updateResult);

    // Store the actual auth ID back so we can reference it
    u._authId = authId;
  }
}

// ---------------------------------------------------------------------------
// Step 3: Create teams
// ---------------------------------------------------------------------------
async function seedTeams() {
  console.log("\n--- Seeding teams ---");

  const builder = TEST_USERS.find((u) => u.email === "builder@loopsflow.test");
  const builder2 = TEST_USERS.find(
    (u) => u.email === "builder2@loopsflow.test",
  );

  // Team Alpha (owned by builder)
  check(
    "Team Alpha",
    await supabase.from("teams").insert({
      id: IDS.team_alpha,
      name: "Team Alpha",
      owner_id: builder._authId,
    }),
  );

  // Team Beta (owned by builder2)
  check(
    "Team Beta",
    await supabase.from("teams").insert({
      id: IDS.team_beta,
      name: "Team Beta",
      owner_id: builder2._authId,
    }),
  );

  // Add members
  check(
    "Team Alpha members",
    await supabase.from("team_members").insert([
      { team_id: IDS.team_alpha, user_id: builder._authId, role: "owner" },
      { team_id: IDS.team_alpha, user_id: builder2._authId, role: "member" },
    ]),
  );

  check(
    "Team Beta members",
    await supabase
      .from("team_members")
      .insert([
        { team_id: IDS.team_beta, user_id: builder2._authId, role: "owner" },
      ]),
  );
}

// ---------------------------------------------------------------------------
// Step 4: Create boosters (one per type)
// ---------------------------------------------------------------------------
async function seedBoosters() {
  console.log("\n--- Seeding boosters ---");

  const host = TEST_USERS.find((u) => u.email === "host@loopsflow.test");

  const boosters = [
    {
      id: IDS.booster_idea,
      host_id: host._authId,
      booster_type: "idea",
      name: "ETH Denver 2026 Idea Booster",
      description:
        "48-hour hackathon to build the next generation of decentralized applications.",
      theme: "Build the future of Web3",
      problem_statements: [
        "How can DeFi be made more accessible to mainstream users?",
        "What new governance models can improve DAO participation?",
        "How can on-chain identity solutions preserve privacy?",
      ],
      website_url: "https://ethdenver.com",
      technical_docs:
        "Solidity best practices, Hardhat testing, ERC-20/721/1155 patterns.",
      bounty_pool_summary: "$50K in prizes across 3 sponsor tracks",
      program_goal:
        "Identify and support innovative DeFi, identity, and governance ideas.",
      timeline: "Feb 28 - Mar 2, 2026",
      organizer_notes: "Focus on usability and real-world adoption potential.",
      status: "active",
      start_date: "2026-02-28T00:00:00Z",
      end_date: "2026-03-02T00:00:00Z",
    },
    {
      id: IDS.booster_momentum,
      host_id: host._authId,
      booster_type: "momentum",
      name: "Loops Momentum Sprint",
      description:
        "4-week acceleration program for projects with initial traction.",
      theme: "From prototype to product",
      problem_statements: [
        "How do you get your first 100 users?",
        "What metrics matter at the early stage?",
        "How to iterate on feedback without losing vision?",
      ],
      program_goal: "Help 10 projects ship their v1 and acquire initial users.",
      timeline: "March 2026 (rolling admission)",
      status: "active",
    },
    {
      id: IDS.booster_capital,
      host_id: host._authId,
      booster_type: "capital",
      name: "Capital Raise Booster Q1",
      description:
        "Pitch day and fundraising bootcamp for seed-stage projects.",
      theme: "Fundraising fundamentals",
      problem_statements: [
        "How to craft a compelling pitch deck?",
        "What do investors look for in early-stage crypto projects?",
        "How to structure a token raise vs equity?",
      ],
      bounty_pool_summary:
        "$100K lead investment + $500K follow-on opportunity",
      program_goal: "Connect 5 projects with investors for seed funding.",
      timeline: "April 2026",
      status: "draft",
    },
  ];

  check("Boosters", await supabase.from("boosters").insert(boosters));
}

// ---------------------------------------------------------------------------
// Step 5: Create booster tracks (sponsors)
// ---------------------------------------------------------------------------
async function seedBoosterTracks() {
  console.log("\n--- Seeding booster tracks ---");

  const tracks = [
    {
      id: IDS.track_eth,
      booster_id: IDS.booster_idea,
      sponsor_name: "Ethereum Foundation",
      track_name: "Core Infrastructure",
      track_description:
        "Build tools, libraries, or protocols that improve Ethereum core infrastructure.",
      docs_text:
        "EIPs reference: https://eips.ethereum.org. Solidity docs: https://docs.soliditylang.org",
      api_endpoints: [
        "https://mainnet.infura.io/v3/",
        "https://eth.llamarpc.com",
      ],
    },
    {
      id: IDS.track_pol,
      booster_id: IDS.booster_idea,
      sponsor_name: "Polygon Labs",
      track_name: "Scaling Solutions",
      track_description:
        "Build applications leveraging Polygon zkEVM or PoS for high-throughput use cases.",
      docs_text: "Polygon zkEVM docs: https://docs.polygon.technology/zkEVM",
      api_endpoints: ["https://polygon-rpc.com"],
    },
    {
      id: IDS.track_arb,
      booster_id: IDS.booster_idea,
      sponsor_name: "Arbitrum DAO",
      track_name: "DeFi Innovation",
      track_description:
        "Create novel DeFi primitives on Arbitrum One or Arbitrum Nova.",
      docs_text: "Arbitrum developer docs: https://docs.arbitrum.io",
      sdk_examples: [
        "const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc')",
      ],
    },
  ];

  check("Booster tracks", await supabase.from("booster_tracks").insert(tracks));
}

// ---------------------------------------------------------------------------
// Step 6: Create projects (loops_profiles)
// ---------------------------------------------------------------------------
async function seedProjects() {
  console.log("\n--- Seeding projects ---");

  const projects = [
    {
      id: IDS.project_defi,
      team_id: IDS.team_alpha,
      name: "YieldFlow Protocol",
      tagline: "Automated yield optimization across DeFi protocols",
      description:
        "YieldFlow is a smart contract system that automatically rebalances user deposits across lending protocols to maximize yield while managing risk.",
      refined_description:
        "YieldFlow Protocol is an AI-powered yield optimization engine that automatically rebalances user deposits across multiple DeFi lending protocols (Aave, Compound, Morpho) to maximize risk-adjusted returns. It uses on-chain analytics and predictive models to anticipate rate changes and move funds proactively.",
      category: "DeFi",
      tech_stack: [
        "Solidity",
        "Hardhat",
        "React",
        "TypeScript",
        "ethers.js",
        "The Graph",
      ],
      colors: {
        primary_color: "#6366f1",
        secondary_color: "#818cf8",
        accent_color: "#a78bfa",
        theme_label: "indigo-modern",
      },
      key_features: [
        "Auto-rebalancing across Aave, Compound, and Morpho",
        "Risk scoring per vault strategy",
        "Gas-optimized batch transactions",
        "Real-time yield dashboard",
        "Multi-sig treasury management",
      ],
      logo_url: "https://placehold.co/200x200",
      github_url: "https://github.com/example/yieldflow",
      website_url: "https://yieldflow.example.com",
      screenshot_urls: [
        "https://placehold.co/800x450",
        "https://placehold.co/800x450",
      ],
      additional_links: [
        { label: "Docs", url: "https://docs.yieldflow.example.com" },
      ],
      social_links: [
        { label: "Twitter", url: "https://twitter.com/yieldflow" },
      ],
      flattened_codebase:
        "// contracts/YieldVault.sol\npragma solidity ^0.8.20;\n\nimport '@openzeppelin/contracts/token/ERC20/ERC20.sol';\n\ncontract YieldVault is ERC20 {\n    mapping(address => uint256) public deposits;\n    \n    function deposit(uint256 amount) external {\n        deposits[msg.sender] += amount;\n        _mint(msg.sender, amount);\n    }\n    \n    function rebalance() external {\n        // AI-driven rebalancing logic\n    }\n}\n",
      kb_sections: ["profile", "code", "theme"],
      knowledge_base_chunks: 24,
    },
    {
      id: IDS.project_nft,
      team_id: IDS.team_alpha,
      name: "ArtChain Gallery",
      tagline: "Curated NFT marketplace for digital artists",
      description:
        "ArtChain is a curated NFT marketplace focusing on quality digital art with built-in royalty enforcement.",
      refined_description:
        "ArtChain Gallery is a curated NFT marketplace that prioritizes quality digital art through a curation DAO. It features on-chain royalty enforcement via ERC-2981, gasless minting via meta-transactions, and a discovery engine powered by visual similarity search.",
      category: "NFT / Art",
      tech_stack: ["Solidity", "Next.js", "IPFS", "TypeScript", "Tailwind CSS"],
      colors: {
        primary_color: "#ec4899",
        secondary_color: "#f472b6",
        accent_color: "#f9a8d4",
        theme_label: "pink-creative",
      },
      key_features: [
        "Curated submissions via DAO voting",
        "On-chain royalty enforcement (ERC-2981)",
        "Gasless minting with meta-transactions",
        "Visual similarity search for art discovery",
        "Artist verification badges",
      ],
      logo_url: "https://placehold.co/200x200",
      github_url: "https://github.com/example/artchain",
      kb_sections: ["profile", "code"],
      knowledge_base_chunks: 18,
    },
    {
      id: IDS.project_social,
      team_id: IDS.team_beta,
      name: "DevConnect Hub",
      tagline: "Professional networking for Web3 developers",
      description:
        "A social platform built specifically for Web3 developers to connect, collaborate, and find opportunities.",
      refined_description:
        "DevConnect Hub is a professional networking platform designed exclusively for Web3 developers. It uses on-chain credentials and GitHub activity to verify skills, matches developers with project opportunities, and provides a reputation system based on contributions to open-source Web3 projects.",
      category: "Social / Developer Tools",
      tech_stack: [
        "Next.js",
        "TypeScript",
        "Supabase",
        "Tailwind CSS",
        "Prisma",
      ],
      colors: {
        primary_color: "#10b981",
        secondary_color: "#34d399",
        accent_color: "#6ee7b7",
        theme_label: "emerald-professional",
      },
      key_features: [
        "On-chain credential verification",
        "GitHub activity integration",
        "Project opportunity matching",
        "Developer reputation scoring",
        "Real-time chat with code sharing",
      ],
      logo_url: "https://placehold.co/200x200",
      github_url: "https://github.com/example/devconnect",
      website_url: "https://devconnect.example.com",
      kb_sections: ["profile", "code", "demo"],
      knowledge_base_chunks: 31,
    },
  ];

  check("Projects", await supabase.from("loops_profiles").insert(projects));
}

// ---------------------------------------------------------------------------
// Step 7: Create knowledge bases (for vector search)
// ---------------------------------------------------------------------------
async function seedKnowledgeBases() {
  console.log("\n--- Seeding knowledge bases ---");

  check(
    "Knowledge bases",
    await supabase.from("knowledge_bases").insert([
      {
        id: IDS.kb_defi,
        project_id: IDS.project_defi,
        sources: { profile: true, code: true, theme: true },
      },
      {
        id: IDS.kb_nft,
        project_id: IDS.project_nft,
        sources: { profile: true, code: true },
      },
    ]),
  );

  // Update projects with knowledge_base_id FK
  await supabase
    .from("loops_profiles")
    .update({ knowledge_base_id: IDS.kb_defi })
    .eq("id", IDS.project_defi);
  await supabase
    .from("loops_profiles")
    .update({ knowledge_base_id: IDS.kb_nft })
    .eq("id", IDS.project_nft);
  console.log("  [OK]   Linked knowledge bases to projects");
}

// ---------------------------------------------------------------------------
// Step 8: Create submissions
// ---------------------------------------------------------------------------
async function seedSubmissions() {
  console.log("\n--- Seeding submissions ---");

  const submissions = [
    {
      id: IDS.sub_defi_idea,
      booster_id: IDS.booster_idea,
      team_id: IDS.team_alpha,
      project_id: IDS.project_defi,
      status: "scored",
      ai_score: {
        overall_score: 82,
        criteria_scores: [
          {
            name: "Code Integration & Technical Depth",
            score: 88,
            weight: 0.25,
          },
          { name: "Ideation & Problem Definition", score: 85, weight: 0.2 },
          { name: "Uniqueness & Innovation", score: 75, weight: 0.2 },
          { name: "Product Readiness", score: 80, weight: 0.2 },
          { name: "Track/Sponsor Fit", score: 78, weight: 0.15 },
        ],
      },
      human_score: {
        overall_score: 79,
        notes: "Strong technical foundation, needs better UX.",
      },
      momentum_score: 42,
    },
    {
      id: IDS.sub_nft_idea,
      booster_id: IDS.booster_idea,
      team_id: IDS.team_alpha,
      project_id: IDS.project_nft,
      status: "submitted",
      ai_score: {},
      human_score: {},
      momentum_score: 0,
    },
    {
      id: IDS.sub_social_momentum,
      booster_id: IDS.booster_momentum,
      team_id: IDS.team_beta,
      project_id: IDS.project_social,
      status: "under_review",
      ai_score: {
        overall_score: 71,
        criteria_scores: [
          {
            name: "Code Integration & Technical Depth",
            score: 70,
            weight: 0.25,
          },
          { name: "Ideation & Problem Definition", score: 80, weight: 0.2 },
          { name: "Uniqueness & Innovation", score: 65, weight: 0.2 },
          { name: "Product Readiness", score: 68, weight: 0.2 },
          { name: "Track/Sponsor Fit", score: 72, weight: 0.15 },
        ],
      },
      human_score: {},
      momentum_score: 15,
    },
  ];

  check("Submissions", await supabase.from("submissions").insert(submissions));
}

// ---------------------------------------------------------------------------
// Step 9: Create judge invites
// ---------------------------------------------------------------------------
async function seedJudgeInvites() {
  console.log("\n--- Seeding judge invites ---");

  const host = TEST_USERS.find((u) => u.email === "host@loopsflow.test");
  const judge = TEST_USERS.find((u) => u.email === "judge@loopsflow.test");

  check(
    "Judge invite",
    await supabase.from("judge_invites").insert({
      booster_id: IDS.booster_idea,
      judge_user_id: judge._authId,
      assigned_tracks: [IDS.track_eth, IDS.track_pol],
      invited_by: host._authId,
      accepted: true,
    }),
  );
}

// ---------------------------------------------------------------------------
// Step 10: Create host applications
// ---------------------------------------------------------------------------
async function seedHostApplications() {
  console.log("\n--- Seeding host applications ---");

  const builder = TEST_USERS.find((u) => u.email === "builder@loopsflow.test");
  const admin = TEST_USERS.find((u) => u.email === "admin@loopsflow.test");

  check(
    "Host application (pending)",
    await supabase.from("host_applications").insert({
      user_id: builder._authId,
      booster_type: "idea",
      event_name: "Community Hack Night",
      expected_participants: 50,
      contact: "alice@example.com",
      description:
        "A monthly community hackathon focused on local developer engagement.",
      status: "pending",
    }),
  );

  check(
    "Host application (approved)",
    await supabase.from("host_applications").insert({
      user_id: admin._authId,
      booster_type: "momentum",
      event_name: "Startup Accelerator Cohort 3",
      expected_participants: 200,
      contact: "eve@example.com",
      description: "8-week acceleration program for pre-seed Web3 startups.",
      status: "approved",
      reviewed_by: admin._authId,
    }),
  );
}

// ---------------------------------------------------------------------------
// CSV parser — handles quoted fields with embedded newlines and escaped quotes
// ---------------------------------------------------------------------------
function parseCSV(text) {
  const rows = [];
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; // skip BOM

  while (i < text.length) {
    const row = [];
    while (i < text.length) {
      if (text[i] === '"') {
        i++;
        let field = "";
        while (i < text.length) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++;
              break;
            }
          } else {
            field += text[i];
            i++;
          }
        }
        row.push(field);
      } else {
        let field = "";
        while (
          i < text.length &&
          text[i] !== "," &&
          text[i] !== "\n" &&
          text[i] !== "\r"
        ) {
          field += text[i];
          i++;
        }
        row.push(field);
      }
      if (i < text.length && text[i] === ",") {
        i++;
      } else {
        break;
      }
    }
    if (i < text.length && text[i] === "\r") i++;
    if (i < text.length && text[i] === "\n") i++;
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Step 11: Seed hackathon projects from TestProjects.csv
// ---------------------------------------------------------------------------
async function seedCSVData() {
  console.log("\n--- Seeding hackathon projects from CSV ---");

  const csvPath = resolve(ROOT, "scripts", "TestProjects.csv");
  let csvText;
  try {
    csvText = readFileSync(csvPath, "utf-8");
  } catch {
    console.log("  [SKIP] TestProjects.csv not found");
    return { users: 0, projects: 0 };
  }

  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    console.log("  [SKIP] CSV has no data rows");
    return { users: 0, projects: 0 };
  }

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1).filter((r) => r.length >= 10);
  const col = (name) => headers.indexOf(name);

  // Identify unique submitters by email
  const submitterMap = new Map();
  for (const row of dataRows) {
    const email = row[col("Email Address")]?.trim();
    if (!email || submitterMap.has(email)) continue;
    submitterMap.set(email, {
      email,
      firstName: row[col("First Name")]?.trim() || "Builder",
      lastName: row[col("Last Name")]?.trim() || "",
      twitter: row[col("Twitter Profile")]?.trim() || "",
    });
  }

  // Pre-hash the shared hackathon password once
  const hackathonPasswordHash = bcrypt.hashSync("Hackathon123!", 10);

  // Create builder users + teams for each unique submitter
  const userMap = new Map(); // email → { authId, teamId }
  for (const [email, info] of submitterMap) {
    const displayName = `${info.firstName} ${info.lastName}`.trim();
    const username = `${info.firstName}_${info.lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password_hash: hackathonPasswordHash,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    });

    if (error) {
      console.error(`  [FAIL] Auth user ${email}:`, error.message);
      continue;
    }

    const authId = data.user.id;
    console.log(`  [OK]   User ${displayName} (${email})`);

    await supabase
      .from("users")
      .update({ role: "builder", display_name: displayName, username })
      .eq("id", authId);

    const teamId = randomUUID();
    await supabase.from("teams").insert({
      id: teamId,
      name: `Team ${info.firstName}`,
      owner_id: authId,
    });
    await supabase.from("team_members").insert({
      team_id: teamId,
      user_id: authId,
      role: "owner",
    });

    userMap.set(email, { authId, teamId });
  }

  console.log(`  [OK]   ${userMap.size} hackathon users + teams`);

  // Create projects and submissions from each CSV row
  let projectCount = 0;
  let submissionCount = 0;

  for (const row of dataRows) {
    const email = row[col("Email Address")]?.trim();
    const user = userMap.get(email);
    if (!user) continue;

    const projectName = row[col("Project Name")]?.trim();
    if (!projectName) continue;

    const problemStatement = row[col("Problem Statement")]?.trim() || "";
    const projectDesc = row[col("Project Description")]?.trim() || "";
    const githubUrl = row[col("Project Source Code")]?.trim() || "";
    const demoUrl =
      row[col("Project Live Demo")]?.trim() ||
      row[col("Project Live Demo ")]?.trim() ||
      "";
    const presentationUrl = row[col("Project Presentation")]?.trim() || "";
    const videoUrl = row[col("Project Video Demo")]?.trim() || "";
    const twitter = submitterMap.get(email)?.twitter || "";

    // Tagline = first sentence of problem statement (max 200 chars)
    const tagline =
      problemStatement.split(/[.\n]/)[0]?.trim().slice(0, 200) || projectName;

    const additionalLinks = [];
    if (presentationUrl)
      additionalLinks.push({ label: "Presentation", url: presentationUrl });
    if (videoUrl) additionalLinks.push({ label: "Video Demo", url: videoUrl });

    const socialLinks = [];
    if (twitter) socialLinks.push({ label: "Twitter", url: twitter });

    const projectId = randomUUID();
    const projectData = {
      id: projectId,
      team_id: user.teamId,
      name: projectName,
      tagline,
      description: problemStatement,
      refined_description: projectDesc,
      category: "Hackathon",
    };
    if (githubUrl) projectData.github_url = githubUrl;
    if (demoUrl) projectData.website_url = demoUrl;
    if (additionalLinks.length) projectData.additional_links = additionalLinks;
    if (socialLinks.length) projectData.social_links = socialLinks;

    const { error } = await supabase.from("loops_profiles").insert(projectData);
    if (error) {
      console.error(`  [FAIL] Project "${projectName}":`, error.message);
      continue;
    }
    projectCount++;

    // Submit each project to ETH Denver Idea Booster
    const subResult = await supabase.from("submissions").insert({
      id: randomUUID(),
      booster_id: IDS.booster_idea,
      team_id: user.teamId,
      project_id: projectId,
      status: "submitted",
      ai_score: {},
      human_score: {},
      momentum_score: 0,
    });
    if (!subResult.error) submissionCount++;
  }

  console.log(`  [OK]   ${projectCount} hackathon projects`);
  console.log(
    `  [OK]   ${submissionCount} submissions → ETH Denver Idea Booster`,
  );
  return { users: userMap.size, projects: projectCount };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("========================================");
  console.log("LoopsFlow Database Seeder");
  console.log("========================================");
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  await clearAll();
  await seedUsers();
  await seedTeams();
  await seedBoosters();
  await seedBoosterTracks();
  await seedProjects();
  await seedKnowledgeBases();
  await seedSubmissions();
  await seedJudgeInvites();
  await seedHostApplications();
  const csv = await seedCSVData();

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n========================================");
  console.log("SEED COMPLETE");
  console.log("========================================");

  console.log("\n--- Test Credentials ---");
  console.log("");
  console.log("  Email                       Password       Role");
  console.log("  -------------------------------------------------------");
  for (const u of TEST_USERS) {
    console.log(`  ${u.email.padEnd(30)} ${u.password.padEnd(15)} ${u.role}`);
  }
  if (csv.users > 0) {
    console.log("");
    console.log("  Hackathon submitters — all use password: Hackathon123!");
  }

  console.log("\n--- Testing Sequences Per Role ---");

  console.log("\n  BUILDER (builder@loopsflow.test / Builder123!):");
  console.log("  1. Login at /login with email/password");
  console.log(
    "  2. Visit /builder → see project hub with 2 projects (YieldFlow, ArtChain)",
  );
  console.log("  3. Visit /builder/projects → view project list");
  console.log(
    "  4. Visit /builder/projects/<id> → see full project details, colors, KB tabs",
  );
  console.log(
    "  5. Click 'Share (generate posts)' → test Social Amplifier AI agent",
  );
  console.log(
    "  6. Visit /builder/new → create a new project profile (needs GitHub URL)",
  );
  console.log("  7. Visit /builder/teams → see Team Alpha membership");
  console.log(
    "  8. Visit /builder/ideate → test AI ideation chat (select a booster)",
  );
  console.log("  9. Visit /boosters → browse available boosters");
  console.log(
    "  10. Visit /boosters/<type>/<id>/submit → submit project to booster",
  );

  console.log("\n  HOST (host@loopsflow.test / Host123!):");
  console.log("  1. Login at /login with email/password");
  console.log("  2. Visit /host → see dashboard with submitted projects");
  console.log(
    "  3. Click 'Grade project' → opens /host/judging with pre-selected project+booster",
  );
  console.log(
    "  4. Visit /host/boosters → create/edit boosters, run AI generator",
  );
  console.log(
    "  5. Visit /host/analytics → select booster, generate AI analytics report",
  );
  console.log(
    "  6. Visit /host/judging → evaluate any project against any booster",
  );

  console.log("\n  VIEWER (viewer@loopsflow.test / Viewer123!):");
  console.log("  1. Login at /login with email/password");
  console.log("  2. Visit /viewer → see all projects gallery");
  console.log(
    "  3. Visit /viewer/projects/<id> → project detail + code query + chat",
  );
  console.log(
    "  4. Test code query: ask 'How does the deposit function work?'",
  );
  console.log(
    "  5. Test project chat: have multi-turn conversation about the project",
  );
  console.log(
    "  6. Visit /boosters → browse boosters (public, no auth required)",
  );

  console.log("\n  ADMIN (admin@loopsflow.test / Admin123!):");
  console.log("  1. Login at /login with email/password");
  console.log("  2. Admin can access all builder routes (/builder/*)");
  console.log("  3. Admin can access all host routes (/host/*)");
  console.log(
    "  4. Admin can use all AI agents (all API routes allow 'admin' role)",
  );
  console.log("  5. Admin can review host applications");

  console.log("\n  JUDGE (judge@loopsflow.test / Judge123!):");
  console.log("  1. Login at /login with email/password");
  console.log("  2. Judge can access /host/judging → evaluate projects");
  console.log(
    "  3. Judge has an invite for ETH Denver Idea Booster (tracks: Ethereum, Polygon)",
  );
  console.log(
    "  4. Judge uses project-evaluator API (only agent allowing 'judge' role)",
  );

  console.log("\n--- Seeded Data Summary ---");
  console.log(
    `  Users:          ${6 + csv.users} (6 test + ${csv.users} hackathon)`,
  );
  console.log(
    `  Teams:          ${2 + csv.users} (2 test + ${csv.users} hackathon)`,
  );
  console.log(
    `  Projects:       ${3 + csv.projects} (3 test + ${csv.projects} hackathon)`,
  );
  console.log(
    "  Boosters:       3 (idea active, momentum active, capital draft)",
  );
  console.log(
    "  Booster Tracks: 3 (Ethereum, Polygon, Arbitrum on Idea Booster)",
  );
  console.log(
    `  Submissions:    ${3 + csv.projects} (3 test + ${csv.projects} hackathon → Idea Booster)`,
  );
  console.log("  Judge Invites:  1 (Frank Judge → Idea Booster)");
  console.log("  Host Apps:      2 (1 pending, 1 approved)");
  console.log("  Knowledge Bases:2 (YieldFlow, ArtChain)");
  console.log("");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
