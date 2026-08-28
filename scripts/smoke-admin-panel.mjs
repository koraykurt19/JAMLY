import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.production.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = process.env.SMOKE_BASE_URL || "https://getjamly.com";
const preRegisterUrl = process.env.SMOKE_PRE_REGISTER_URL || "https://pre-register.getjamly.com";
const outDir = resolve(process.cwd(), "work", "live-smoke");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error("Missing Supabase service credentials. Admin panel smoke was not run.");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const account = {
  email: "jamly-admin-smoke@example.net",
  handle: "jamlyadminsmoke",
  password: `JamlyAdmin-${randomBytes(12).toString("base64url")}!1`
};
const betaAccount = {
  email: "jamly-beta-smoke@example.net",
  handle: "jamlybetasmoke",
  password: `JamlyBeta-${randomBytes(12).toString("base64url")}!1`
};

const results = [];
const bad = [];
let smokeUserId = null;
let betaSmokeUserId = null;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "en-US"
});
const page = await context.newPage();

page.on("pageerror", (error) => bad.push(`pageerror ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") bad.push(`console ${message.text()}`);
});
page.on("response", (response) => {
  if (response.status() >= 500) bad.push(`response ${response.status()} ${response.url()}`);
});

try {
  const user = await upsertAdminSmokeUser();
  smokeUserId = user.id;
  await seedProfile(user.id);
  await grantTemporaryAdmin(user.id);
  const betaUser = await upsertBetaSmokeUser();
  betaSmokeUserId = betaUser.id;
  await seedBetaProfile(betaUser.id);
  await clearBetaAccess(betaUser.id);

  const token = await signInForToken();

  await page.goto(`${baseUrl}/auth/sign-in?next=%2Fadmin`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/auth/sign-in"), { timeout: 30000 }),
    page.getByRole("button", { name: /giri|sign in/i }).click()
  ]);

  await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle", timeout: 45000 });
  await expectVisible(page.getByRole("heading", { name: /platform control center|platform kontrol merkezi/i }), "admin overview renders");
  await expectVisible(page.getByRole("button", { name: /users|kullan/i }), "admin users tab button renders");

  await page.getByRole("button", { name: /users|kullan/i }).click();
  await expectVisible(page.getByText(/data plan|veri plani/i).first(), "users table shows retention plan column");
  await expectVisible(page.getByText(/jamlyadminsmoke/i).first(), "temporary admin smoke user appears in users table");

  await page.goto(`${baseUrl}/admin/retention`, { waitUntil: "networkidle", timeout: 45000 });
  await expectVisible(page.getByRole("heading", { name: /data retention cleanup|veri koruma/i }).first(), "retention panel renders");
  await expectVisible(page.getByText(/recent retention runs|son temizlik/i).first(), "retention run history renders");
  await expectVisible(page.getByText(/never deleted|asla silinmeyen/i).first(), "retention protected-data copy renders");
  await expectVisible(page.getByText(/storage cost signal|storage maliyet sinyali/i).first(), "retention storage audit panel renders");

  await page.goto(`${baseUrl}/admin/waitlist`, { waitUntil: "networkidle", timeout: 45000 });
  await expectVisible(page.getByText(/pre-register pipeline|on kayit hatti/i).first(), "waitlist summary renders");
  await expectVisible(page.getByText(/invite-ready|davete hazir/i).first(), "waitlist invite-ready metric renders");
  await expectVisible(page.getByText(/growth signal|buyume sinyali/i).first(), "waitlist growth metric renders");
  await expectVisible(page.getByText(/signal|sinyal/i).first(), "waitlist intent column renders");
  await expectVisible(page.getByText(/launch/i).first(), "waitlist launch signal column renders");

  const usersResponse = await context.request.get(`${baseUrl}/api/admin/users?q=jamlyadminsmoke`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30000
  });
  const usersBody = await usersResponse.json().catch(() => ({}));
  const smokeUser = Array.isArray(usersBody.users)
    ? usersBody.users.find((user) => user.handle === account.handle)
    : null;
  record(
    "admin users API includes beta and retention fields",
    usersResponse.ok() &&
      smokeUser?.isAdmin === true &&
      smokeUser?.isBetaAllowed === true &&
      typeof smokeUser?.isBetaDirectAllowed === "boolean" &&
      smokeUser?.retentionPlan === "standard" &&
      Number(smokeUser?.retentionMultiplier) === 1,
    `HTTP ${usersResponse.status()}`
  );

  const betaOpenResponse = await context.request.patch(
    `${baseUrl}/api/admin/users/${betaSmokeUserId}/beta-access`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        isActive: true,
        reason: "Smoke test grants direct beta access to a non-admin account."
      },
      timeout: 30000
    }
  );
  const betaOpenBody = await betaOpenResponse.json().catch(() => ({}));
  record(
    "admin beta access API grants direct non-admin beta",
    betaOpenResponse.ok() && betaOpenBody.isActive === true,
    `HTTP ${betaOpenResponse.status()}`
  );

  const betaUsersResponse = await context.request.get(`${baseUrl}/api/admin/users?q=${betaAccount.handle}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30000
  });
  const betaUsersBody = await betaUsersResponse.json().catch(() => ({}));
  const betaSmokeUser = Array.isArray(betaUsersBody.users)
    ? betaUsersBody.users.find((user) => user.handle === betaAccount.handle)
    : null;
  record(
    "admin users API reports direct beta without admin role",
    betaUsersResponse.ok() &&
      betaSmokeUser?.isAdmin === false &&
      betaSmokeUser?.isBetaDirectAllowed === true &&
      betaSmokeUser?.isBetaAllowed === true,
    `HTTP ${betaUsersResponse.status()}`
  );

  const betaCloseResponse = await context.request.patch(
    `${baseUrl}/api/admin/users/${betaSmokeUserId}/beta-access`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        isActive: false,
        reason: "Smoke test revokes direct beta access after verification."
      },
      timeout: 30000
    }
  );
  const betaCloseBody = await betaCloseResponse.json().catch(() => ({}));
  record(
    "admin beta access API revokes direct beta",
    betaCloseResponse.ok() && betaCloseBody.isActive === false,
    `HTTP ${betaCloseResponse.status()}`
  );

  const retentionResponse = await context.request.get(`${baseUrl}/api/admin/retention`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30000
  });
  const retentionBody = await retentionResponse.json().catch(() => ({}));
  record(
    "admin retention API returns a dry-run plan",
    retentionResponse.ok() &&
      retentionBody.plan?.mode === "dry_run" &&
      Array.isArray(retentionBody.plan?.policies) &&
      Array.isArray(retentionBody.plan?.neverDelete) &&
      retentionBody.plan.neverDelete.includes("profiles") &&
      (retentionBody.storageAudit === null ||
        Number.isFinite(Number(retentionBody.storageAudit?.deletionCandidateBytes))),
    `HTTP ${retentionResponse.status()}`
  );

  const waitlistResponse = await context.request.get(`${baseUrl}/api/admin/waitlist?page=0`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30000
  });
  const waitlistBody = await waitlistResponse.json().catch(() => ({}));
  record(
    "admin waitlist API returns pipeline summary",
    waitlistResponse.ok() &&
      Number.isInteger(waitlistBody.summary?.total) &&
      Number.isInteger(waitlistBody.summary?.joinedLast24h) &&
      Number.isInteger(waitlistBody.summary?.personas?.creator) &&
      Number.isInteger(waitlistBody.summary?.statuses?.invited) &&
      Number.isInteger(waitlistBody.summary?.triage?.inviteReady) &&
      Number.isInteger(waitlistBody.summary?.triage?.growthLeads) &&
      Number.isInteger(waitlistBody.summary?.triage?.needsReview),
    `HTTP ${waitlistResponse.status()}`
  );
  const waitlistEntry = Array.isArray(waitlistBody.entries) ? waitlistBody.entries[0] : null;
  record(
    "admin waitlist API returns launch signal metadata",
    waitlistResponse.ok() &&
      (!waitlistEntry ||
        (waitlistEntry.launch_signal !== null && typeof waitlistEntry.launch_signal === "object")),
    `HTTP ${waitlistResponse.status()}`
  );

  const preRegisterAdminResponse = await context.request.get(`${preRegisterUrl}/api/admin/overview`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30000
  });
  record(
    "pre-register host blocks admin API even for an admin token",
    preRegisterAdminResponse.status() === 404,
    `HTTP ${preRegisterAdminResponse.status()}`
  );

  await page.screenshot({ path: join(outDir, `${stamp}-admin-panel.png`), fullPage: true });
  record("browser saw no page errors or 5xx", bad.length === 0, bad.slice(0, 5).join(" | "));
} finally {
  await browser.close();
  if (betaSmokeUserId) await cleanupBetaSmokeUser(betaSmokeUserId).catch((error) => {
    console.error(`Temporary beta smoke cleanup failed: ${error.message}`);
  });
  if (smokeUserId) await revokeTemporaryAdmin(smokeUserId).catch((error) => {
    console.error(`Temporary admin cleanup failed: ${error.message}`);
  });
}

const failed = results.filter((result) => !result.ok);
writeFileSync(
  join(outDir, `${stamp}-admin-panel-smoke.json`),
  JSON.stringify({ checkedAt: new Date().toISOString(), results, failed, bad }, null, 2)
);

if (failed.length > 0) {
  console.error(`\n${failed.length} admin panel smoke checks failed.`);
  process.exit(1);
}

console.log(`\nAll ${results.length} admin panel smoke checks passed.`);

async function expectVisible(locator, name) {
  try {
    await locator.waitFor({ state: "visible", timeout: 20000 });
    record(name, true);
  } catch (error) {
    record(name, false, error instanceof Error ? error.message : String(error));
  }
}

function record(name, ok, note = "") {
  results.push({ name, ok, note });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${note ? ` - ${note}` : ""}`);
}

async function upsertAdminSmokeUser() {
  const existing = await findUser(account.email);
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: account.password,
      email_confirm: true,
      user_metadata: {
        handle: account.handle,
        full_name: "Jamly Admin Smoke"
      }
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: {
      handle: account.handle,
      full_name: "Jamly Admin Smoke"
    }
  });
  if (error) throw error;
  return data.user;
}

async function upsertBetaSmokeUser() {
  const existing = await findUser(betaAccount.email);
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: betaAccount.password,
      email_confirm: true,
      user_metadata: {
        handle: betaAccount.handle,
        full_name: "Jamly Beta Smoke"
      }
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: betaAccount.email,
    password: betaAccount.password,
    email_confirm: true,
    user_metadata: {
      handle: betaAccount.handle,
      full_name: "Jamly Beta Smoke"
    }
  });
  if (error) throw error;
  return data.user;
}

async function seedProfile(userId) {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    role: "buyer",
    handle: account.handle,
    full_name: "Jamly Admin Smoke",
    headline: "Temporary smoke account for admin panel verification",
    bio: "This account receives temporary admin access only while smoke-admin-panel runs.",
    account_status: "active",
    specialties: ["admin-smoke"]
  });
  if (error) throw error;
}

async function seedBetaProfile(userId) {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    role: "buyer",
    handle: betaAccount.handle,
    full_name: "Jamly Beta Smoke",
    headline: "Temporary smoke account for direct beta access verification",
    bio: "This account is created and removed by smoke-admin-panel.",
    account_status: "active",
    specialties: ["beta-smoke"]
  });
  if (error) throw error;
}

async function clearBetaAccess(userId) {
  const { error } = await supabase.from("profile_beta_access").delete().eq("profile_id", userId);
  if (error) throw error;
}

async function cleanupBetaSmokeUser(userId) {
  await clearBetaAccess(userId);
  const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
  if (profileError) throw profileError;
  const { error: userError } = await supabase.auth.admin.deleteUser(userId);
  if (userError) throw userError;
}

async function grantTemporaryAdmin(userId) {
  const { error } = await supabase.from("admin_accounts").upsert({
    user_id: userId,
    role: "super_admin",
    is_active: true,
    notes: "Temporary admin panel smoke access"
  });
  if (error) throw error;
}

async function revokeTemporaryAdmin(userId) {
  const { error } = await supabase.from("admin_accounts").delete().eq("user_id", userId);
  if (error) throw error;
}

async function signInForToken() {
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data, error } = await userClient.auth.signInWithPassword({
    email: account.email,
    password: account.password
  });
  if (error) throw error;
  if (!data.session?.access_token) throw new Error("Admin smoke sign-in did not return a token.");
  return data.session.access_token;
}

async function findUser(email) {
  let page = 1;
  while (page < 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
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
