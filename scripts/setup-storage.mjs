#!/usr/bin/env node
/**
 * Create Supabase Storage buckets.
 * Run this if buckets are missing (shown by npm run db:status).
 *
 * Usage: node scripts/setup-storage.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = {};
readFileSync('.env', 'utf-8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const buckets = [
  { id: 'project-assets', name: 'project-assets', public: true },
  { id: 'hackathon-assets', name: 'hackathon-assets', public: true },
  { id: 'user-avatars', name: 'user-avatars', public: true },
];

console.log('Creating storage buckets...');
for (const bucket of buckets) {
  const { error } = await client.storage.createBucket(bucket.id, {
    public: bucket.public,
  });
  if (error) {
    if (error.message.includes('already exists')) {
      console.log(`  [EXISTS] ${bucket.id}`);
    } else {
      console.log(`  [ERROR]  ${bucket.id}: ${error.message}`);
    }
  } else {
    console.log(`  [OK]     ${bucket.id} (public: ${bucket.public})`);
  }
}

// Verify
const { data: list } = await client.storage.listBuckets();
console.log(`\nBuckets: ${list?.map(b => b.name).join(', ') || 'none'}`);
