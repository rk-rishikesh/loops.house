#!/usr/bin/env node

/**
 * LoopsFlow Database Seeder
 *
 * Seeds 3 hackathons in different phases:
 *   1. "building" — accepting submissions, no projects submitted
 *   2. "judging"  — projects submitted, judges + speakers assigned
 *   3. "completed" — AI + 4 human judges scored all submissions, ready to finalize
 *
 * Also seeds: 6 test users, 2 teams, 6 projects, knowledge bases, tracks, and CSV data.
 *
 * Uses the Supabase Admin API (service role key) to create auth users
 * and bypass RLS for all inserts.
 *
 * Usage:
 *   node scripts/seed-db.mjs
 *   npm run db:seed
 */

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Stable UUIDs for deterministic seeding
// ---------------------------------------------------------------------------
const IDS = {
  // Users (6 core + 3 extra judges)
  builder_user: "a0000000-0000-0000-0000-000000000001",
  host_user: "a0000000-0000-0000-0000-000000000002",
  viewer_user: "a0000000-0000-0000-0000-000000000003",
  admin_user: "a0000000-0000-0000-0000-000000000004",
  judge_user: "a0000000-0000-0000-0000-000000000005",
  builder2_user: "a0000000-0000-0000-0000-000000000006",
  judge2_user: "a0000000-0000-0000-0000-000000000007",
  judge3_user: "a0000000-0000-0000-0000-000000000008",
  judge4_user: "a0000000-0000-0000-0000-000000000009",

  // Teams
  team_alpha: "b0000000-0000-0000-0000-000000000001",
  team_beta: "b0000000-0000-0000-0000-000000000002",
  team_gamma: "b0000000-0000-0000-0000-000000000003",

  // Projects (loops_profiles)
  project_defi: "c0000000-0000-0000-0000-000000000001",
  project_nft: "c0000000-0000-0000-0000-000000000002",
  project_social: "c0000000-0000-0000-0000-000000000003",
  project_dao: "c0000000-0000-0000-0000-000000000004",
  project_bridge: "c0000000-0000-0000-0000-000000000005",
  project_wallet: "c0000000-0000-0000-0000-000000000006",

  // Hackathons (3 in different phases)
  hackathon_building: "d0000000-0000-0000-0000-000000000001",
  hackathon_judging: "d0000000-0000-0000-0000-000000000002",
  hackathon_completed: "d0000000-0000-0000-0000-000000000003",

  // Hackathon tracks
  track_eth: "e0000000-0000-0000-0000-000000000001",
  track_pol: "e0000000-0000-0000-0000-000000000002",
  track_arb: "e0000000-0000-0000-0000-000000000003",
  track_sol: "e0000000-0000-0000-0000-000000000004",
  track_base: "e0000000-0000-0000-0000-000000000005",
  track_avax: "e0000000-0000-0000-0000-000000000006",

  // Submissions
  sub_defi_judging: "f0000000-0000-0000-0000-000000000001",
  sub_nft_judging: "f0000000-0000-0000-0000-000000000002",
  sub_social_judging: "f0000000-0000-0000-0000-000000000003",
  sub_dao_completed: "f0000000-0000-0000-0000-000000000004",
  sub_bridge_completed: "f0000000-0000-0000-0000-000000000005",
  sub_wallet_completed: "f0000000-0000-0000-0000-000000000006",

  // Knowledge bases
  kb_defi: "00000000-ab00-0000-0000-000000000001",
  kb_nft: "00000000-ab00-0000-0000-000000000002",
  kb_dao: "00000000-ab00-0000-0000-000000000003",

  // Speakers
  speaker_1: "00000000-cc00-0000-0000-000000000001",
  speaker_2: "00000000-cc00-0000-0000-000000000002",
  speaker_3: "00000000-cc00-0000-0000-000000000003",
};

// ---------------------------------------------------------------------------
// Test user credentials
// ---------------------------------------------------------------------------
const TEST_USERS = [
  {
    id: IDS.builder_user,
    email: "builder@loopsflow.test",
    password: "Builder123!",
    is_admin: false,
    is_event_creator: false,
    display_name: "Alice Builder",
    username: "alice_builder",
  },
  {
    id: IDS.builder2_user,
    email: "builder2@loopsflow.test",
    password: "Builder2123!",
    is_admin: false,
    is_event_creator: false,
    display_name: "Dave Builder",
    username: "dave_builder",
  },
  {
    id: IDS.host_user,
    email: "host@loopsflow.test",
    password: "Host123!",
    is_admin: false,
    is_event_creator: true,
    display_name: "Bob Host",
    username: "bob_host",
  },
  {
    id: IDS.viewer_user,
    email: "viewer@loopsflow.test",
    password: "Viewer123!",
    is_admin: false,
    is_event_creator: false,
    display_name: "Carol Viewer",
    username: "carol_viewer",
  },
  {
    id: IDS.admin_user,
    email: "admin@loopsflow.test",
    password: "Admin123!",
    is_admin: true,
    is_event_creator: true,
    display_name: "Eve Admin",
    username: "eve_admin",
  },
  {
    id: IDS.judge_user,
    email: "judge@loopsflow.test",
    password: "Judge123!",
    is_admin: false,
    is_event_creator: false,
    display_name: "Frank Judge",
    username: "frank_judge",
  },
  {
    id: IDS.judge2_user,
    email: "judge2@loopsflow.test",
    password: "Judge2123!",
    is_admin: false,
    is_event_creator: false,
    display_name: "Grace Judge",
    username: "grace_judge",
  },
  {
    id: IDS.judge3_user,
    email: "judge3@loopsflow.test",
    password: "Judge3123!",
    is_admin: false,
    is_event_creator: false,
    display_name: "Hank Judge",
    username: "hank_judge",
  },
  {
    id: IDS.judge4_user,
    email: "judge4@loopsflow.test",
    password: "Judge4123!",
    is_admin: false,
    is_event_creator: false,
    display_name: "Iris Judge",
    username: "iris_judge",
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

  const tables = [
    "rate_limits",
    "hackathon_results",
    "hackathon_speakers",
    "hackathon_track_chunks",
    "knowledge_base_chunks",
    "knowledge_bases",
    "human_evaluations",
    "submissions",
    "invitations",
    "hackathon_judges",
    "hackathon_cohosts",
    "hackathon_tracks",
    "loops_profiles",
    "team_members",
    "teams",
    "hackathons",
    "users",
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error && !error.message.includes("0 rows")) {
      if (table === "rate_limits") {
        const { error: e2 } = await supabase.from(table).delete().neq("key", "__nonexistent__");
        if (e2) console.error(`  [WARN] ${table}:`, e2.message);
        else console.log(`  [OK]   Cleared ${table}`);
        continue;
      }
      if (
        table === "team_members" ||
        table === "hackathon_cohosts" ||
        table === "hackathon_judges"
      ) {
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
    const passwordHash = bcrypt.hashSync(u.password, 10);

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

    const updateResult = await supabase
      .from("users")
      .update({
        is_admin: u.is_admin,
        is_event_creator: u.is_event_creator,
        display_name: u.display_name,
        username: u.username,
      })
      .eq("id", authId);

    check(
      `  Updated flags for ${u.email} (admin=${u.is_admin}, event_creator=${u.is_event_creator})`,
      updateResult,
    );

    u._authId = authId;
  }
}

// ---------------------------------------------------------------------------
// Step 3: Create teams
// ---------------------------------------------------------------------------
async function seedTeams() {
  console.log("\n--- Seeding teams ---");

  const builder = TEST_USERS.find((u) => u.email === "builder@loopsflow.test");
  const builder2 = TEST_USERS.find((u) => u.email === "builder2@loopsflow.test");

  // Team Alpha (owned by builder — has 2 members)
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

  // Team Gamma (owned by builder — for extra projects)
  check(
    "Team Gamma",
    await supabase.from("teams").insert({
      id: IDS.team_gamma,
      name: "Team Gamma",
      owner_id: builder._authId,
    }),
  );

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
      .insert([{ team_id: IDS.team_beta, user_id: builder2._authId, role: "owner" }]),
  );

  check(
    "Team Gamma members",
    await supabase
      .from("team_members")
      .insert([{ team_id: IDS.team_gamma, user_id: builder._authId, role: "owner" }]),
  );
}

// ---------------------------------------------------------------------------
// Step 4: Create 3 hackathons in different phases
// ---------------------------------------------------------------------------
async function seedHackathons() {
  console.log("\n--- Seeding hackathons (3 phases) ---");

  const host = TEST_USERS.find((u) => u.email === "host@loopsflow.test");
  const now = new Date();

  // Helper to create ISO date strings relative to now
  const daysFromNow = (d) => new Date(now.getTime() + d * 86400000).toISOString();

  const hackathons = [
    // ── HACKATHON 1: "building" phase ──
    // start_date in past, submission_deadline in future
    {
      id: IDS.hackathon_building,
      host_id: host._authId,
      name: "ETH Denver 2026 Hackathon",
      description: "48-hour hackathon to build the next generation of decentralized applications.",
      theme: "Build the future of Web3",
      problem_statements: [
        "How can DeFi be made more accessible to mainstream users?",
        "What new governance models can improve DAO participation?",
        "How can on-chain identity solutions preserve privacy?",
      ],
      website_url: "https://ethdenver.com",
      technical_docs: "Solidity best practices, Hardhat testing, ERC-20/721/1155 patterns.",
      bounty_pool_summary: "$50K in prizes across 3 sponsor tracks",
      program_goal: "Identify and support innovative DeFi, identity, and governance ideas.",
      organizer_notes: "Focus on usability and real-world adoption potential.",
      judging_criteria: [
        {
          name: "Technical Execution",
          description: "Code quality, architecture, and implementation",
        },
        { name: "Innovation", description: "Novelty of the idea and approach" },
        { name: "User Experience", description: "Design, usability, and polish" },
        { name: "Impact", description: "Potential real-world impact and adoption" },
      ],
      status: "active",
      start_date: daysFromNow(-2), // started 2 days ago
      submission_deadline: daysFromNow(5), // 5 days from now
      judging_deadline: daysFromNow(8),
      results_date: daysFromNow(10),
    },

    // ── HACKATHON 2: "judging" phase ──
    // start_date and submission_deadline in past, results_date in future
    {
      id: IDS.hackathon_judging,
      host_id: host._authId,
      name: "Loops Momentum Sprint",
      description: "4-week acceleration program for projects with initial traction.",
      theme: "From prototype to product",
      problem_statements: [
        "How do you get your first 100 users?",
        "What metrics matter at the early stage?",
        "How to iterate on feedback without losing vision?",
      ],
      program_goal: "Help 10 projects ship their v1 and acquire initial users.",
      judging_criteria: [
        {
          name: "Code Integration & Technical Depth",
          description: "Quality of code and technical architecture",
        },
        {
          name: "Ideation & Problem Definition",
          description: "Clarity of the problem being solved",
        },
        { name: "Uniqueness & Innovation", description: "How novel is the approach" },
        { name: "Product Readiness", description: "How close to production-ready" },
        { name: "Track/Sponsor Fit", description: "Alignment with sponsor track goals" },
      ],
      status: "active",
      start_date: daysFromNow(-14), // started 14 days ago
      submission_deadline: daysFromNow(-2), // closed 2 days ago
      judging_deadline: daysFromNow(5),
      results_date: daysFromNow(7),
    },

    // ── HACKATHON 3: "completed" phase ──
    // All dates in past, results_date passed, finalized_at is NULL → "completed"
    {
      id: IDS.hackathon_completed,
      host_id: host._authId,
      name: "Capital Raise Hackathon Q1",
      description: "Pitch day and fundraising bootcamp for seed-stage projects.",
      theme: "Fundraising fundamentals",
      problem_statements: [
        "How to craft a compelling pitch deck?",
        "What do investors look for in early-stage crypto projects?",
        "How to structure a token raise vs equity?",
      ],
      bounty_pool_summary: "$100K lead investment + $500K follow-on opportunity",
      program_goal: "Connect 5 projects with investors for seed funding.",
      judging_criteria: [
        { name: "Business Model", description: "Revenue model and sustainability" },
        { name: "Team & Execution", description: "Team capabilities and track record" },
        { name: "Market Opportunity", description: "Market size and timing" },
        { name: "Technical Innovation", description: "Novel tech or approach" },
        { name: "Pitch Quality", description: "Clarity and persuasiveness of pitch" },
      ],
      status: "active",
      ai_weight: 0.4,
      start_date: daysFromNow(-30), // started 30 days ago
      submission_deadline: daysFromNow(-14), // closed 14 days ago
      judging_deadline: daysFromNow(-5), // judging done 5 days ago
      results_date: daysFromNow(-2), // results date 2 days ago
      // finalized_at is NULL → phase = "completed" (ready to finalize)
    },
  ];

  check("Hackathons", await supabase.from("hackathons").insert(hackathons));
}

// ---------------------------------------------------------------------------
// Step 5: Create hackathon tracks (sponsors)
// ---------------------------------------------------------------------------
async function seedHackathonTracks() {
  console.log("\n--- Seeding hackathon tracks ---");

  const tracks = [
    // Tracks for "building" hackathon
    {
      id: IDS.track_eth,
      hackathon_id: IDS.hackathon_building,
      sponsor_name: "Ethereum Foundation",
      track_name: "Core Infrastructure",
      track_description:
        "Build tools, libraries, or protocols that improve Ethereum core infrastructure.",
      docs_text:
        "EIPs reference: https://eips.ethereum.org. Solidity docs: https://docs.soliditylang.org",
      api_endpoints: ["https://mainnet.infura.io/v3/", "https://eth.llamarpc.com"],
    },
    {
      id: IDS.track_pol,
      hackathon_id: IDS.hackathon_building,
      sponsor_name: "Polygon Labs",
      track_name: "Scaling Solutions",
      track_description:
        "Build applications leveraging Polygon zkEVM or PoS for high-throughput use cases.",
      docs_text: "Polygon zkEVM docs: https://docs.polygon.technology/zkEVM",
      api_endpoints: ["https://polygon-rpc.com"],
    },
    // Tracks for "judging" hackathon
    {
      id: IDS.track_arb,
      hackathon_id: IDS.hackathon_judging,
      sponsor_name: "Arbitrum DAO",
      track_name: "DeFi Innovation",
      track_description: "Create novel DeFi primitives on Arbitrum One or Arbitrum Nova.",
      docs_text: "Arbitrum developer docs: https://docs.arbitrum.io",
      sdk_examples: ["const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc')"],
    },
    {
      id: IDS.track_sol,
      hackathon_id: IDS.hackathon_judging,
      sponsor_name: "Solana Foundation",
      track_name: "High-Performance dApps",
      track_description: "Build high-throughput applications on Solana.",
      docs_text: "Solana docs: https://docs.solana.com",
    },
    // Tracks for "completed" hackathon
    {
      id: IDS.track_base,
      hackathon_id: IDS.hackathon_completed,
      sponsor_name: "Base (Coinbase)",
      track_name: "Consumer Crypto",
      track_description: "Build consumer-facing crypto applications on Base L2.",
      docs_text: "Base docs: https://docs.base.org",
    },
    {
      id: IDS.track_avax,
      hackathon_id: IDS.hackathon_completed,
      sponsor_name: "Avalanche Foundation",
      track_name: "Subnet Innovation",
      track_description: "Build custom subnet applications on Avalanche.",
      docs_text: "Avalanche docs: https://docs.avax.network",
    },
  ];

  check("Hackathon tracks", await supabase.from("hackathon_tracks").insert(tracks));
}

// ---------------------------------------------------------------------------
// Step 6: Create projects (loops_profiles)
// ---------------------------------------------------------------------------
async function seedProjects() {
  console.log("\n--- Seeding projects ---");

  const projects = [
    // Projects for "judging" hackathon (submitted, being judged)
    {
      id: IDS.project_defi,
      team_id: IDS.team_alpha,
      name: "YieldFlow Protocol",
      tagline: "Automated yield optimization across DeFi protocols",
      description:
        "YieldFlow is a smart contract system that automatically rebalances user deposits across lending protocols to maximize yield while managing risk.",
      refined_description:
        "YieldFlow Protocol is an AI-powered yield optimization engine that automatically rebalances user deposits across multiple DeFi lending protocols (Aave, Compound, Morpho) to maximize risk-adjusted returns.",
      category: "DeFi",
      tech_stack: ["Solidity", "Hardhat", "React", "TypeScript", "ethers.js", "The Graph"],
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
      screenshot_urls: ["https://placehold.co/800x450", "https://placehold.co/800x450"],
      additional_links: [{ label: "Docs", url: "https://docs.yieldflow.example.com" }],
      social_links: [{ label: "Twitter", url: "https://twitter.com/yieldflow" }],
      flattened_codebase:
        "// contracts/YieldVault.sol\npragma solidity ^0.8.20;\n\nimport '@openzeppelin/contracts/token/ERC20/ERC20.sol';\n\ncontract YieldVault is ERC20 {\n    mapping(address => uint256) public deposits;\n    function deposit(uint256 amount) external { deposits[msg.sender] += amount; _mint(msg.sender, amount); }\n    function rebalance() external { /* AI-driven rebalancing */ }\n}\n",
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
        "ArtChain Gallery is a curated NFT marketplace that prioritizes quality digital art through a curation DAO. Features on-chain royalty enforcement via ERC-2981 and gasless minting via meta-transactions.",
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
        "DevConnect Hub is a professional networking platform designed exclusively for Web3 developers. It uses on-chain credentials and GitHub activity to verify skills.",
      category: "Social / Developer Tools",
      tech_stack: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS", "Prisma"],
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

    // Projects for "completed" hackathon (fully judged)
    {
      id: IDS.project_dao,
      team_id: IDS.team_alpha,
      name: "GovernanceAI",
      tagline: "AI-powered DAO governance and proposal analysis",
      description:
        "GovernanceAI uses LLMs to analyze DAO proposals, predict outcomes, and help delegates make informed voting decisions.",
      refined_description:
        "GovernanceAI is an AI-powered DAO governance toolkit that analyzes proposals using NLP, predicts voter sentiment, and provides delegates with context-rich summaries to improve participation and decision quality.",
      category: "DAO / Governance",
      tech_stack: ["Solidity", "Python", "React", "TypeScript", "OpenAI API", "The Graph"],
      colors: {
        primary_color: "#8b5cf6",
        secondary_color: "#a78bfa",
        accent_color: "#c4b5fd",
        theme_label: "violet-governance",
      },
      key_features: [
        "AI proposal summarization",
        "Voter sentiment prediction",
        "Delegate dashboard",
        "Historical voting pattern analysis",
        "Multi-DAO support",
      ],
      logo_url: "https://placehold.co/200x200",
      github_url: "https://github.com/example/governanceai",
      website_url: "https://governanceai.example.com",
    },
    {
      id: IDS.project_bridge,
      team_id: IDS.team_beta,
      name: "OmniBridge",
      tagline: "Universal cross-chain bridge with intent-based routing",
      description:
        "OmniBridge is a cross-chain bridge that uses intent-based design to find the optimal route for any token transfer across EVM and non-EVM chains.",
      refined_description:
        "OmniBridge provides intent-based cross-chain transfers with MEV protection. Users specify what they want, and solvers compete to fulfill the intent at the best price across 12+ chains.",
      category: "Infrastructure",
      tech_stack: ["Solidity", "Rust", "TypeScript", "Next.js", "Go"],
      colors: {
        primary_color: "#f59e0b",
        secondary_color: "#fbbf24",
        accent_color: "#fcd34d",
        theme_label: "amber-infra",
      },
      key_features: [
        "Intent-based routing",
        "MEV protection",
        "12+ chain support",
        "Solver competition marketplace",
        "Sub-minute finality",
      ],
      logo_url: "https://placehold.co/200x200",
      github_url: "https://github.com/example/omnibridge",
      website_url: "https://omnibridge.example.com",
    },
    {
      id: IDS.project_wallet,
      team_id: IDS.team_gamma,
      name: "SmartVault",
      tagline: "Account-abstracted smart wallet with social recovery",
      description:
        "SmartVault is an ERC-4337 smart wallet with social recovery, session keys, and gas sponsorship built in.",
      refined_description:
        "SmartVault leverages ERC-4337 account abstraction to provide a seamless wallet experience: social recovery via guardians, session keys for dApp interactions, and gas sponsorship for onboarding.",
      category: "Wallet / UX",
      tech_stack: ["Solidity", "TypeScript", "React Native", "Expo", "ethers.js"],
      colors: {
        primary_color: "#0ea5e9",
        secondary_color: "#38bdf8",
        accent_color: "#7dd3fc",
        theme_label: "sky-wallet",
      },
      key_features: [
        "ERC-4337 account abstraction",
        "Social recovery via guardians",
        "Session keys for dApps",
        "Gas sponsorship",
        "Biometric authentication",
      ],
      logo_url: "https://placehold.co/200x200",
      github_url: "https://github.com/example/smartvault",
    },
  ];

  check("Projects", await supabase.from("loops_profiles").insert(projects));
}

// ---------------------------------------------------------------------------
// Step 7: Create knowledge bases
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
      { id: IDS.kb_nft, project_id: IDS.project_nft, sources: { profile: true, code: true } },
      { id: IDS.kb_dao, project_id: IDS.project_dao, sources: { profile: true, code: true } },
    ]),
  );

  await supabase
    .from("loops_profiles")
    .update({ knowledge_base_id: IDS.kb_defi })
    .eq("id", IDS.project_defi);
  await supabase
    .from("loops_profiles")
    .update({ knowledge_base_id: IDS.kb_nft })
    .eq("id", IDS.project_nft);
  await supabase
    .from("loops_profiles")
    .update({ knowledge_base_id: IDS.kb_dao })
    .eq("id", IDS.project_dao);
  console.log("  [OK]   Linked knowledge bases to projects");
}

// ---------------------------------------------------------------------------
// Step 8: Create submissions
// ---------------------------------------------------------------------------
async function seedSubmissions() {
  console.log("\n--- Seeding submissions ---");

  const now = new Date().toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();

  const submissions = [
    // ── "judging" hackathon: 3 submissions (some AI scored, some not) ──
    {
      id: IDS.sub_defi_judging,
      hackathon_id: IDS.hackathon_judging,
      team_id: IDS.team_alpha,
      project_id: IDS.project_defi,
      status: "submitted",
      ai_score: {},
      momentum_score: 42,
    },
    {
      id: IDS.sub_nft_judging,
      hackathon_id: IDS.hackathon_judging,
      team_id: IDS.team_alpha,
      project_id: IDS.project_nft,
      status: "submitted",
      ai_score: {},
      momentum_score: 28,
    },
    {
      id: IDS.sub_social_judging,
      hackathon_id: IDS.hackathon_judging,
      team_id: IDS.team_beta,
      project_id: IDS.project_social,
      status: "submitted",
      ai_score: {},
      momentum_score: 15,
    },

    // ── "completed" hackathon: 3 submissions, ALL with AI scores ──
    {
      id: IDS.sub_dao_completed,
      hackathon_id: IDS.hackathon_completed,
      team_id: IDS.team_alpha,
      project_id: IDS.project_dao,
      status: "scored",
      ai_score: {
        overall_score: 88,
        criteria_scores: [
          { name: "Business Model", score: 85, weight: 0.2 },
          { name: "Team & Execution", score: 90, weight: 0.2 },
          { name: "Market Opportunity", score: 92, weight: 0.2 },
          { name: "Technical Innovation", score: 88, weight: 0.2 },
          { name: "Pitch Quality", score: 85, weight: 0.2 },
        ],
      },
      ai_evaluated_at: twoDaysAgo,
      momentum_score: 65,
    },
    {
      id: IDS.sub_bridge_completed,
      hackathon_id: IDS.hackathon_completed,
      team_id: IDS.team_beta,
      project_id: IDS.project_bridge,
      status: "scored",
      ai_score: {
        overall_score: 79,
        criteria_scores: [
          { name: "Business Model", score: 75, weight: 0.2 },
          { name: "Team & Execution", score: 82, weight: 0.2 },
          { name: "Market Opportunity", score: 78, weight: 0.2 },
          { name: "Technical Innovation", score: 85, weight: 0.2 },
          { name: "Pitch Quality", score: 72, weight: 0.2 },
        ],
      },
      ai_evaluated_at: twoDaysAgo,
      momentum_score: 38,
    },
    {
      id: IDS.sub_wallet_completed,
      hackathon_id: IDS.hackathon_completed,
      team_id: IDS.team_gamma,
      project_id: IDS.project_wallet,
      status: "scored",
      ai_score: {
        overall_score: 72,
        criteria_scores: [
          { name: "Business Model", score: 68, weight: 0.2 },
          { name: "Team & Execution", score: 75, weight: 0.2 },
          { name: "Market Opportunity", score: 70, weight: 0.2 },
          { name: "Technical Innovation", score: 78, weight: 0.2 },
          { name: "Pitch Quality", score: 65, weight: 0.2 },
        ],
      },
      ai_evaluated_at: twoDaysAgo,
      momentum_score: 22,
    },
  ];

  check("Submissions", await supabase.from("submissions").insert(submissions));
}

// ---------------------------------------------------------------------------
// Step 9: Create hackathon judges, cohosts, speakers
// ---------------------------------------------------------------------------
async function seedHackathonRoles() {
  console.log("\n--- Seeding hackathon judges, cohosts & speakers ---");

  const host = TEST_USERS.find((u) => u.email === "host@loopsflow.test");
  const admin = TEST_USERS.find((u) => u.email === "admin@loopsflow.test");
  const judge1 = TEST_USERS.find((u) => u.email === "judge@loopsflow.test");
  const judge2 = TEST_USERS.find((u) => u.email === "judge2@loopsflow.test");
  const judge3 = TEST_USERS.find((u) => u.email === "judge3@loopsflow.test");
  const judge4 = TEST_USERS.find((u) => u.email === "judge4@loopsflow.test");

  // ── Cohosts ──
  // Host is auto-cohost via migration, but seed explicitly for the completed hackathon
  check(
    "Cohost (Eve Admin → judging hackathon)",
    await supabase.from("hackathon_cohosts").insert({
      hackathon_id: IDS.hackathon_judging,
      user_id: admin._authId,
    }),
  );
  check(
    "Cohost (Eve Admin → completed hackathon)",
    await supabase.from("hackathon_cohosts").insert({
      hackathon_id: IDS.hackathon_completed,
      user_id: admin._authId,
    }),
  );

  // ── Judges for "judging" hackathon (Frank only — partial judging) ──
  check(
    "Judge (Frank → judging hackathon)",
    await supabase.from("hackathon_judges").insert({
      hackathon_id: IDS.hackathon_judging,
      user_id: judge1._authId,
      assigned_tracks: [IDS.track_arb],
    }),
  );

  // ── Judges for "completed" hackathon (4 judges — all have evaluated) ──
  check(
    "Judges (4 → completed hackathon)",
    await supabase.from("hackathon_judges").insert([
      {
        hackathon_id: IDS.hackathon_completed,
        user_id: judge1._authId,
        assigned_tracks: [IDS.track_base],
      },
      {
        hackathon_id: IDS.hackathon_completed,
        user_id: judge2._authId,
        assigned_tracks: [IDS.track_base],
      },
      {
        hackathon_id: IDS.hackathon_completed,
        user_id: judge3._authId,
        assigned_tracks: [IDS.track_avax],
      },
      {
        hackathon_id: IDS.hackathon_completed,
        user_id: judge4._authId,
        assigned_tracks: [IDS.track_avax],
      },
    ]),
  );

  // ── Speakers for "judging" hackathon ──
  check(
    "Speakers (judging hackathon)",
    await supabase.from("hackathon_speakers").insert([
      {
        id: IDS.speaker_1,
        hackathon_id: IDS.hackathon_judging,
        name: "Vitalik Buterin",
        image_url: "https://placehold.co/150x150",
      },
      {
        id: IDS.speaker_2,
        hackathon_id: IDS.hackathon_judging,
        name: "Stani Kulechov",
        image_url: "https://placehold.co/150x150",
      },
      {
        id: IDS.speaker_3,
        hackathon_id: IDS.hackathon_completed,
        name: "Brian Armstrong",
        image_url: "https://placehold.co/150x150",
      },
    ]),
  );
}

// ---------------------------------------------------------------------------
// Step 10: Create human evaluations (4 judges × 3 submissions for completed hackathon)
// ---------------------------------------------------------------------------
async function seedHumanEvaluations() {
  console.log("\n--- Seeding human evaluations (completed hackathon) ---");

  const judge1 = TEST_USERS.find((u) => u.email === "judge@loopsflow.test");
  const judge2 = TEST_USERS.find((u) => u.email === "judge2@loopsflow.test");
  const judge3 = TEST_USERS.find((u) => u.email === "judge3@loopsflow.test");
  const judge4 = TEST_USERS.find((u) => u.email === "judge4@loopsflow.test");

  const judges = [judge1, judge2, judge3, judge4];
  const submissions = [
    { id: IDS.sub_dao_completed, name: "GovernanceAI" },
    { id: IDS.sub_bridge_completed, name: "OmniBridge" },
    { id: IDS.sub_wallet_completed, name: "SmartVault" },
  ];

  // Scoring matrix: [judge][submission] → { overall, scores }
  const scoringMatrix = [
    // Judge 1 (Frank)
    [
      {
        overall: 87,
        scores: {
          "Business Model": 85,
          "Team & Execution": 90,
          "Market Opportunity": 88,
          "Technical Innovation": 85,
          "Pitch Quality": 87,
        },
        remarks: {
          "Business Model": "Solid revenue model via subscription fees",
          "Team & Execution": "Experienced team with prior exits",
        },
        notes: "Top contender. Strong across all criteria.",
      },
      {
        overall: 76,
        scores: {
          "Business Model": 72,
          "Team & Execution": 80,
          "Market Opportunity": 75,
          "Technical Innovation": 82,
          "Pitch Quality": 70,
        },
        remarks: { "Technical Innovation": "Novel intent-based design" },
        notes: "Good tech but needs clearer monetization.",
      },
      {
        overall: 70,
        scores: {
          "Business Model": 65,
          "Team & Execution": 72,
          "Market Opportunity": 70,
          "Technical Innovation": 75,
          "Pitch Quality": 68,
        },
        remarks: { "Technical Innovation": "ERC-4337 is promising" },
        notes: "Decent wallet, competitive market.",
      },
    ],
    // Judge 2 (Grace)
    [
      {
        overall: 90,
        scores: {
          "Business Model": 88,
          "Team & Execution": 92,
          "Market Opportunity": 90,
          "Technical Innovation": 90,
          "Pitch Quality": 90,
        },
        remarks: { "Market Opportunity": "Massive TAM in DAO governance" },
        notes: "Exceptional project. Best in class.",
      },
      {
        overall: 78,
        scores: {
          "Business Model": 75,
          "Team & Execution": 78,
          "Market Opportunity": 80,
          "Technical Innovation": 80,
          "Pitch Quality": 75,
        },
        remarks: { "Market Opportunity": "Growing cross-chain demand" },
        notes: "Solid fundamentals, needs polish.",
      },
      {
        overall: 68,
        scores: {
          "Business Model": 62,
          "Team & Execution": 70,
          "Market Opportunity": 68,
          "Technical Innovation": 72,
          "Pitch Quality": 65,
        },
        remarks: {},
        notes: "Needs differentiation from existing wallets.",
      },
    ],
    // Judge 3 (Hank)
    [
      {
        overall: 85,
        scores: {
          "Business Model": 82,
          "Team & Execution": 88,
          "Market Opportunity": 85,
          "Technical Innovation": 87,
          "Pitch Quality": 82,
        },
        remarks: { "Team & Execution": "Clear execution roadmap" },
        notes: "Very promising. Would invest.",
      },
      {
        overall: 80,
        scores: {
          "Business Model": 78,
          "Team & Execution": 82,
          "Market Opportunity": 80,
          "Technical Innovation": 84,
          "Pitch Quality": 76,
        },
        remarks: { "Technical Innovation": "Solver marketplace is innovative" },
        notes: "Strong technical foundation.",
      },
      {
        overall: 72,
        scores: {
          "Business Model": 70,
          "Team & Execution": 74,
          "Market Opportunity": 72,
          "Technical Innovation": 76,
          "Pitch Quality": 68,
        },
        remarks: {},
        notes: "Good UX focus, needs business model work.",
      },
    ],
    // Judge 4 (Iris)
    [
      {
        overall: 86,
        scores: {
          "Business Model": 84,
          "Team & Execution": 88,
          "Market Opportunity": 86,
          "Technical Innovation": 86,
          "Pitch Quality": 85,
        },
        remarks: { "Pitch Quality": "Clear and compelling narrative" },
        notes: "Strong across the board. Minor UX polish needed.",
      },
      {
        overall: 74,
        scores: {
          "Business Model": 70,
          "Team & Execution": 76,
          "Market Opportunity": 74,
          "Technical Innovation": 78,
          "Pitch Quality": 72,
        },
        remarks: {},
        notes: "Interesting concept, crowded space.",
      },
      {
        overall: 65,
        scores: {
          "Business Model": 60,
          "Team & Execution": 68,
          "Market Opportunity": 65,
          "Technical Innovation": 70,
          "Pitch Quality": 62,
        },
        remarks: {},
        notes: "Early stage, needs more traction.",
      },
    ],
  ];

  const evaluations = [];
  for (let j = 0; j < judges.length; j++) {
    for (let s = 0; s < submissions.length; s++) {
      evaluations.push({
        submission_id: submissions[s].id,
        judge_id: judges[j]._authId,
        hackathon_id: IDS.hackathon_completed,
        scores: scoringMatrix[j][s].scores,
        remarks: scoringMatrix[j][s].remarks,
        overall_notes: scoringMatrix[j][s].notes,
        overall_score: scoringMatrix[j][s].overall,
      });
    }
  }

  check(
    `Human evaluations (${evaluations.length} total: 4 judges × 3 submissions)`,
    await supabase.from("human_evaluations").insert(evaluations),
  );
}

// ---------------------------------------------------------------------------
// CSV parser
// ---------------------------------------------------------------------------
function parseCSV(text) {
  const rows = [];
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;

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
        while (i < text.length && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
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

  const hackathonPasswordHash = bcrypt.hashSync("Hackathon123!", 10);

  const userMap = new Map();
  for (const [email, info] of submitterMap) {
    const displayName = `${info.firstName} ${info.lastName}`.trim();
    const username = `${info.firstName}_${info.lastName}`.toLowerCase().replace(/[^a-z0-9_]/g, "");

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

    await supabase.from("users").update({ display_name: displayName, username }).eq("id", authId);

    const teamId = randomUUID();
    await supabase
      .from("teams")
      .insert({ id: teamId, name: `Team ${info.firstName}`, owner_id: authId });
    await supabase.from("team_members").insert({ team_id: teamId, user_id: authId, role: "owner" });

    userMap.set(email, { authId, teamId });
  }

  console.log(`  [OK]   ${userMap.size} hackathon users + teams`);

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
      row[col("Project Live Demo")]?.trim() || row[col("Project Live Demo ")]?.trim() || "";
    const presentationUrl = row[col("Project Presentation")]?.trim() || "";
    const videoUrl = row[col("Project Video Demo")]?.trim() || "";
    const twitter = submitterMap.get(email)?.twitter || "";

    const tagline = problemStatement.split(/[.\n]/)[0]?.trim().slice(0, 200) || projectName;

    const additionalLinks = [];
    if (presentationUrl) additionalLinks.push({ label: "Presentation", url: presentationUrl });
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

    // Submit CSV projects to the "building" hackathon (since it's accepting submissions)
    const subResult = await supabase.from("submissions").insert({
      id: randomUUID(),
      hackathon_id: IDS.hackathon_building,
      team_id: user.teamId,
      project_id: projectId,
      status: "submitted",
      ai_score: {},
      momentum_score: 0,
    });
    if (!subResult.error) submissionCount++;
  }

  console.log(`  [OK]   ${projectCount} hackathon projects`);
  console.log(`  [OK]   ${submissionCount} submissions → Building Hackathon`);
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
  await seedHackathons();
  await seedHackathonTracks();
  await seedProjects();
  await seedKnowledgeBases();
  await seedSubmissions();
  await seedHackathonRoles();
  await seedHumanEvaluations();
  const csv = await seedCSVData();

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n========================================");
  console.log("SEED COMPLETE");
  console.log("========================================");

  console.log("\n--- Test Credentials ---");
  console.log("");
  console.log("  Email                       Password       Admin  EventCreator");
  console.log("  -----------------------------------------------------------------------");
  for (const u of TEST_USERS) {
    console.log(
      `  ${u.email.padEnd(30)} ${u.password.padEnd(15)} ${String(u.is_admin).padEnd(7)} ${u.is_event_creator}`,
    );
  }
  if (csv.users > 0) {
    console.log("");
    console.log("  Hackathon submitters — all use password: Hackathon123!");
  }

  console.log("\n--- Hackathon Phases ---");
  console.log("");
  console.log("  1. ETH Denver 2026 Hackathon     → BUILDING phase");
  console.log("     - Submissions open, no projects submitted yet");
  console.log("     - 2 sponsor tracks (Ethereum, Polygon)");
  console.log(`     - ID: ${IDS.hackathon_building}`);
  console.log("");
  console.log("  2. Loops Momentum Sprint         → JUDGING phase");
  console.log("     - 3 projects submitted (YieldFlow, ArtChain, DevConnect)");
  console.log("     - 1 judge (Frank), 2 speakers, 2 sponsor tracks");
  console.log("     - No AI or human evaluations yet");
  console.log(`     - ID: ${IDS.hackathon_judging}`);
  console.log("");
  console.log("  3. Capital Raise Hackathon Q1     → COMPLETED phase");
  console.log("     - 3 projects submitted (GovernanceAI, OmniBridge, SmartVault)");
  console.log("     - All AI-evaluated + 4 human judges scored all submissions");
  console.log("     - 12 human evaluations total (4 judges × 3 submissions)");
  console.log("     - Ready to finalize!");
  console.log(`     - ID: ${IDS.hackathon_completed}`);

  console.log("\n--- Testing Sequences Per Role ---");

  console.log("\n  BUILDER (builder@loopsflow.test / Builder123!):");
  console.log("  1. Login at /login → visit /builder → see 4 projects");
  console.log("  2. Visit /hackathons → see 3 hackathons in different phases");
  console.log(
    `  3. Visit /hackathons/${IDS.hackathon_building}/submit → submit project (building phase)`,
  );
  console.log(
    `  4. Visit /hackathons/${IDS.hackathon_judging}/submit → should be blocked (judging phase)`,
  );

  console.log("\n  HOST (host@loopsflow.test / Host123!):");
  console.log(
    `  1. Visit /host/${IDS.hackathon_building}/manage → edit hackathon (building phase)`,
  );
  console.log(
    `  2. Visit /host/${IDS.hackathon_judging}/manage → manage judges/speakers (judging phase)`,
  );
  console.log(
    `  3. Visit /host/${IDS.hackathon_completed}/manage → finalize hackathon (completed phase)`,
  );

  console.log("\n  JUDGE (judge@loopsflow.test / Judge123!):");
  console.log(`  1. Visit /judge/${IDS.hackathon_judging}/<project_id> → evaluate projects`);
  console.log(
    `  2. Visit /judge/${IDS.hackathon_completed}/<project_id> → see existing evaluations`,
  );

  console.log("\n--- Seeded Data Summary ---");
  console.log(
    `  Users:              ${TEST_USERS.length + csv.users} (${TEST_USERS.length} test + ${csv.users} CSV)`,
  );
  console.log(`  Teams:              ${3 + csv.users} (3 test + ${csv.users} CSV)`);
  console.log(`  Projects:           ${6 + csv.projects} (6 test + ${csv.projects} CSV)`);
  console.log("  Hackathons:         3 (building, judging, completed)");
  console.log("  Hackathon Tracks:   6 (2 per hackathon)");
  console.log(`  Submissions:        ${6 + csv.projects} (6 test + ${csv.projects} CSV)`);
  console.log("  Judges:             5 (1 on judging, 4 on completed)");
  console.log("  Cohosts:            2 (Eve Admin on judging + completed)");
  console.log("  Speakers:           3 (2 on judging, 1 on completed)");
  console.log("  Human Evaluations:  12 (4 judges × 3 submissions on completed)");
  console.log("  Knowledge Bases:    3 (YieldFlow, ArtChain, GovernanceAI)");
  console.log("");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
