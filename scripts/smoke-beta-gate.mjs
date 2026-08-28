import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.production.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = process.env.SMOKE_BASE_URL || "https://getjamly.com";
const preRegisterUrl = process.env.SMOKE_PRE_REGISTER_URL || "https://pre-register.getjamly.com";
const outDir = resolve(process.cwd(), "work", "live-smoke");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase service credentials. Beta gate smoke was not run.");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const account = {
  email: "jamly-pre-register-only@example.net",
  handle: "jamlypreregisteronly",
  password: `JamlyGate-${randomBytes(9).toString("base64url")}!1`
};
const results = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const bad = [];

page.on("pageerror", (error) => bad.push(`pageerror ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") bad.push(`console ${message.text()}`);
});
page.on("response", (response) => {
  if (response.status() >= 500) bad.push(`response ${response.status()} ${response.url()}`);
});

try {
  const user = await upsertGateUser();
  await removeAdminAccess(user.id);
  await seedProfile(user.id);

  await page.goto(`${baseUrl}/auth/sign-in?next=/dashboard`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/auth/sign-in"), { timeout: 30000 }),
    page.getByRole("button", { name: /giriş|sign in/i }).click()
  ]);

  record(
    "pre-register-only account is rejected after sign-in",
    page.url().startsWith(preRegisterUrl),
    page.url()
  );

  await page.goto(`${baseUrl}/marketplace`, { waitUntil: "domcontentloaded", timeout: 30000 });
  record(
    "pre-register-only account cannot open marketplace",
    page.url().startsWith(preRegisterUrl),
    page.url()
  );

  const adminResponse = await context.request.get(`${baseUrl}/api/admin/overview`, {
    timeout: 30000
  });
  record(
    "pre-register-only account cannot call admin overview",
    adminResponse.status() === 401 || adminResponse.status() === 403,
    `HTTP ${adminResponse.status()}`
  );

  await page.screenshot({ path: join(outDir, `${stamp}-beta-gate-preregister-only.png`), fullPage: true });
  record("browser saw no page errors or 5xx", bad.length === 0, bad.slice(0, 5).join(" | "));
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
writeFileSync(
  join(outDir, `${stamp}-beta-gate-smoke.json`),
  JSON.stringify({ checkedAt: new Date().toISOString(), results, failed, bad }, null, 2)
);

if (failed.length > 0) {
  console.error(`\n${failed.length} beta gate checks failed.`);
  process.exit(1);
}

console.log(`\nAll ${results.length} beta gate checks passed.`);

function record(name, ok, note = "") {
  results.push({ name, ok, note });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${note ? ` - ${note}` : ""}`);
}

async function upsertGateUser() {
  const existing = await findUser(account.email);
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password: account.password,
      email_confirm: true,
      user_metadata: {
        handle: account.handle,
        full_name: "Jamly Pre-register Only"
      }
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: {
      handle: account.handle,
      full_name: "Jamly Pre-register Only"
    }
  });
  if (error) throw error;
  return data.user;
}

async function seedProfile(userId) {
  const { error } = await admin.from("profiles").upsert({
    id: userId,
    role: "buyer",
    handle: account.handle,
    full_name: "Jamly Pre-register Only",
    headline: "Smoke account that must stay outside closed beta",
    bio: "This account proves pre-register/auth users cannot enter the product without beta access.",
    account_status: "active",
    specialties: ["pre-register"]
  });
  if (error) throw error;
}

async function removeAdminAccess(userId) {
  const { error } = await admin.from("admin_accounts").delete().eq("user_id", userId);
  if (error) throw error;
}

async function findUser(email) {
  let page = 1;
  while (page < 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 100) return null;
    page += 1;
  }
  return null;
}

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;
    if (!process.env[key]) process.env[key] = value;
  }
}
