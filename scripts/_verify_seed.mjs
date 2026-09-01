// TEMPORARY verification helper — seeds throwaway users, then cleans up.
// Usage: node scripts/_verify_seed.mjs <create|cleanup>
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Load .env manually (no dotenv dep guaranteed)
const env = {};
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const ADMIN_EMAIL = "verify-admin@example.test";
const TARGET_EMAIL = "verify-target@example.test";
const PASSWORD = "verify-pass-123456";

async function findByEmail(email) {
  // listUsers is paginated; search a few pages
  for (let page = 1; page <= 10; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const u = data.users.find((x) => x.email === email);
    if (u) return u;
    if (data.users.length < 1000) break;
  }
  return null;
}

async function ensureUser(email, username, roles) {
  let u = await findByEmail(email);
  if (!u) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    u = data.user;
    console.log(`created ${email} -> ${u.id}`);
  } else {
    console.log(`exists  ${email} -> ${u.id}`);
  }
  // Upsert profile
  await admin.from("profiles").upsert(
    { user_id: u.id, username, is_banned: false, ban_reason: null, banned_at: null },
    { onConflict: "user_id" }
  );
  // Roles
  await admin.from("user_roles").delete().eq("user_id", u.id);
  for (const r of roles) {
    await admin.from("user_roles").insert({ user_id: u.id, role: r });
  }
  return u;
}

const cmd = process.argv[2];
if (cmd === "create") {
  await ensureUser(ADMIN_EMAIL, "verify_admin", ["admin"]);
  await ensureUser(TARGET_EMAIL, "verify_target", ["user"]);
  console.log("\nLOGIN:", ADMIN_EMAIL, "/", PASSWORD);
} else if (cmd === "cleanup") {
  for (const email of [ADMIN_EMAIL, TARGET_EMAIL]) {
    const u = await findByEmail(email);
    if (u) {
      await admin.from("user_roles").delete().eq("user_id", u.id);
      await admin.from("profiles").delete().eq("user_id", u.id);
      await admin.auth.admin.deleteUser(u.id);
      console.log(`deleted ${email}`);
    }
  }
} else {
  console.error("usage: node scripts/_verify_seed.mjs <create|cleanup>");
  process.exit(1);
}
