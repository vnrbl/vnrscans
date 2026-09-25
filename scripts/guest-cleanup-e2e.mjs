/**
 * E2E test for the guest auto-cleanup SQL.
 * Run: node scripts/guest-cleanup-e2e.mjs
 *
 * 1. Counts anonymous auth users (total + stale = older than N days)
 * 2. Calls RPC public.cleanup_stale_guests(p_older_than_days := 30)
 * 3. Re-counts to confirm deletion
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("FAIL: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const OLDER_THAN_DAYS = Number(process.argv[2] ?? 30);
const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function countAnon() {
  // Page through auth admin API (per-page max 1000)
  let count = 0;
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const users = data?.users ?? [];
    count += users.filter((u) => u.is_anonymous === true).length;
    if (users.length < perPage) break;
    page += 1;
    if (page > 50) throw new Error("too many user pages, aborting");
  }
  return count;
}

function isStale(user, cutoffMs) {
  return new Date(user.created_at).getTime() < cutoffMs;
}

async function countStaleAnon() {
  const cutoffMs = Date.now() - OLDER_THAN_DAYS * 24 * 60 * 60 * 1000;
  let count = 0;
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const users = data?.users ?? [];
    count += users.filter((u) => u.is_anonymous === true && isStale(u, cutoffMs)).length;
    if (users.length < perPage) break;
    page += 1;
    if (page > 50) throw new Error("too many user pages, aborting");
  }
  return count;
}

async function main() {
  console.log(`Project: ${url}`);
  console.log(`Testing RPC public.cleanup_stale_guests(p_older_than_days := ${OLDER_THAN_DAYS})\n`);

  const [before, beforeStale] = [await countAnon(), await countStaleAnon()];
  console.log(`anon users total:        ${before}`);
  console.log(`anon users stale >${OLDER_THAN_DAYS}d:  ${beforeStale}`);

  const { data, error } = await admin.rpc("cleanup_stale_guests", {
    p_older_than_days: OLDER_THAN_DAYS,
  });

  if (error) {
    console.error(`\nRPC ERROR: ${error.code} ${error.message}`);
    console.error(
      "If PGRST202 (function not found): the SQL wasn't applied to THIS project,",
    );
    console.error(
      "or the grant to service_role is missing. Re-run scripts/guest-cleanup-apply.sql",
    );
    console.error("in the Supabase Dashboard SQL Editor for nzxrshkpjdkrbnsonxos.");
    process.exit(2);
  }

  console.log(`\nRPC result: ${JSON.stringify(data)}`);

  const after = await countAnon();
  const deleted = before - after;
  console.log(`anon users after:        ${after}`);
  console.log(`deleted:                 ${deleted}`);

  const returned = Array.isArray(data) ? data[0]?.deleted_count : data?.deleted_count;
  if (typeof returned === "number" && returned !== deleted) {
    console.error(
      `MISMATCH: RPC reported ${returned} but actual delta was ${deleted} (concurrent signups can cause this)`,
    );
  }

  const expectedUpperBound = beforeStale;
  if (deleted > expectedUpperBound) {
    console.error(
      `SAFETY FAIL: deleted ${deleted} but only ${expectedUpperAnd} stale — function may be deleting fresh guests!`,
    );
    process.exit(3);
  }

  console.log(
    deleted === 0
      ? `\nPASS: RPC callable; 0 stale guests older than ${OLDER_THAN_DAYS}d existed (nothing to delete).`
      : `\nPASS: RPC deleted exactly the stale guests (${deleted}).`,
  );
}

main().catch((e) => {
  console.error("E2E FAILED:", e.message);
  process.exit(1);
});
