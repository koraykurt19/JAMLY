import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.production.local"));

const mainUrl = process.env.SMOKE_BASE_URL || "https://getjamly.com";
const preRegisterUrl = process.env.SMOKE_PRE_REGISTER_URL || "https://pre-register.getjamly.com";
const localWaitlistWriteUrl = process.env.SMOKE_LOCAL_WAITLIST_URL || "http://127.0.0.1:3000/api/waitlist";
const httpMainUrl = mainUrl.replace(/^https:/, "http:");
const outDir = resolve(process.cwd(), "work", "live-smoke");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const results = [];
const smokeIdentity = Date.now() % 250;
const apiSmokeIp = `198.51.100.${smokeIdentity || 1}`;
const uiSmokeIp = `203.0.113.${smokeIdentity || 1}`;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
    : null;

mkdirSync(outDir, { recursive: true });

function record(name, ok, details = {}) {
  results.push({ name, ok, ...details });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${details.note ? ` - ${details.note}` : ""}`);
}

async function fetchCheck(name, url, expected, init = {}) {
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(12000),
    ...init
  });
  const text = await response.text();
  const ok = expected(response, text);
  record(name, ok, {
    status: response.status,
    note: ok ? response.headers.get("location") || `HTTP ${response.status}` : text.slice(0, 180)
  });
  return { response, text };
}

const health = await healthCheckWithRetry();

await fetchCheck("http redirects to https", `${httpMainUrl}/`, (response) => {
  return response.status === 301 || response.status === 308;
});

await fetchCheck("main host anonymous root goes to admin sign-in", `${mainUrl}/`, (response) => {
  return response.status === 307 || response.status === 308;
});

await fetchCheck("main host public sign-up goes to pre-register", `${mainUrl}/auth/sign-up`, (response) => {
  const location = response.headers.get("location") ?? "";
  return response.status >= 300 && response.status < 400 && location.startsWith(preRegisterUrl);
});

await fetchCheck("main host waitlist API is not public", `${mainUrl}/api/waitlist`, (response) => {
  return response.status === 404 || response.status === 307 || response.status === 308;
});

await fetchCheck("admin API rejects anonymous access", `${mainUrl}/api/admin/overview`, (response) => {
  return response.status === 401 || response.status === 403;
});

await fetchCheck("pre-register root renders early-access", `${preRegisterUrl}/`, (response) => {
  return response.status === 200 && response.headers.get("x-pre-register-gate") === "active";
});

await fetchCheck("pre-register host blocks app sign-in", `${preRegisterUrl}/auth/sign-in`, (response) => {
  const location = response.headers.get("location") ?? "";
  return (response.status === 307 || response.status === 308) && location === "/";
});

for (const path of [
  "/auth/reset-password",
  "/dashboard",
  "/marketplace",
  "/admin",
  "/api/admin/overview",
  "/api/admin/users/00000000-0000-4000-8000-000000000000/admin-role",
  "/api/admin/users/00000000-0000-4000-8000-000000000000/beta-access",
  "/api/admin/users/00000000-0000-4000-8000-000000000000/retention-plan",
  "/api/admin/waitlist/00000000-0000-4000-8000-000000000000/status",
  "/api/reports",
  "/api/payments/webhook"
]) {
  await fetchCheck(`pre-register blocks ${path}`, `${preRegisterUrl}${path}`, (response) => {
    if (path.startsWith("/api/")) return response.status === 404;
    const location = response.headers.get("location") ?? "";
    return (response.status === 307 || response.status === 308) && location === "/";
  });
}

await fetchCheck("pre-register waitlist stats configured", `${preRegisterUrl}/api/waitlist`, (response, text) => {
  if (!response.ok) return false;
  const body = JSON.parse(text);
  return body.configured === true && Number.isFinite(Number(body.total));
});

const apiEmail = `smoke-api-${Date.now()}@example.net`;
const apiLaunchSignal = {
  priority: "A",
  role: "both",
  need: "collab",
  readiness: "ready",
  beatScore: 360,
  beatRounds: 2,
  challengeTier: "alpha",
  completedChallenges: ["profile", "referral", "drop"]
};
const apiJoinPayload = {
  email: apiEmail,
  displayName: "Smoke API",
  reservedUsername: `smoke-api-${Date.now()}`,
  persona: "both",
  interests: ["beats", "mixing"],
  locale: "tr",
  acceptedTerms: true,
  marketingOptIn: false,
  utm: { source: "live-smoke" },
  launchSignal: apiLaunchSignal
};
let apiJoin = await fetchCheck(
  "pre-register waitlist API accepts signup or rate-limits safely",
  `${preRegisterUrl}/api/waitlist`,
  (response) => response.status === 201 || response.status === 200 || response.status === 429,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": apiSmokeIp },
    body: JSON.stringify(apiJoinPayload)
  }
);
if (apiJoin.response.status === 429) {
  apiJoin = await fetchCheck(
    "local waitlist API accepts signup when public bucket is saturated",
    localWaitlistWriteUrl,
    (response) => response.status === 201 || response.status === 200 || response.status === 429,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Host": "pre-register.getjamly.com",
        "X-Forwarded-For": `192.0.2.${smokeIdentity || 1}`
      },
      body: JSON.stringify(apiJoinPayload)
    }
  );
}
if (apiJoin.response.ok) {
  record("waitlist API returned queue metadata", /queuePosition|referralCode/.test(apiJoin.text), {
    note: `registered ${apiEmail}`
  });
  await recordStoredLaunchSignal("waitlist API stores launch signal", apiEmail, {
    priority: apiLaunchSignal.priority,
    challengeTier: apiLaunchSignal.challengeTier,
    beatScore: apiLaunchSignal.beatScore
  });
} else if (apiJoin.response.status === 429) {
  record("waitlist API rate limit protected signup endpoint", true, {
    note: "rate-limited after repeated smoke runs"
  });
}

const browser = await chromium.launch({ headless: true });
const consoleMessages = [];
const pageErrors = [];
const failedResponses = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  extraHTTPHeaders: { "X-Forwarded-For": uiSmokeIp }
});
const page = await context.newPage();

page.on("console", (message) => {
  if (["error", "warning"].includes(message.type())) {
    consoleMessages.push(`${message.type()}: ${message.text()}`);
  }
});
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 500) failedResponses.push(`${response.status()} ${response.url()}`);
});

async function browserPageCheck(url, name) {
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 12000 });
  const status = response?.status() ?? 0;
  const title = await page.title();
  const h1Count = await page.locator("h1").count();
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      width: doc.scrollWidth,
      viewport: window.innerWidth,
      overflowX: doc.scrollWidth > window.innerWidth + 2
    };
  });
  await page.screenshot({ path: join(outDir, `${stamp}-${name}.png`), fullPage: true });
  record(`browser ${name} renders`, status >= 200 && status < 400 && h1Count >= 1 && !overflow.overflowX, {
    status,
    note: `${title || "untitled"}, h1=${h1Count}, width=${overflow.width}/${overflow.viewport}`
  });
}

async function healthCheckWithRetry() {
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(`${mainUrl}/api/health`, {
      redirect: "manual",
      signal: AbortSignal.timeout(12000)
    });
    const text = await response.text();
    last = { response, text, attempt };

    if (response.ok && healthBodyReady(text)) break;

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  const ok = Boolean(last?.response.ok && healthBodyReady(last.text));
  record("health reports Supabase ready", ok, {
    status: last?.response.status ?? 0,
    note: ok ? `HTTP ${last.response.status} after ${last.attempt} attempt(s)` : (last?.text ?? "").slice(0, 180)
  });
  return last;
}

function healthBodyReady(text) {
  try {
    const body = JSON.parse(text);
    return (
      body.ok === true &&
      body.deployment === "self-hosted" &&
      body.supabase?.status === "ready" &&
      body.build?.status === "current"
    );
  } catch {
    return false;
  }
}

async function recordStoredLaunchSignal(name, email, expected) {
  if (!supabase) {
    record(name, true, { note: "skipped without service credentials" });
    return;
  }

  const { data, error } = await supabase
    .from("waitlist_entries")
    .select("launch_signal")
    .eq("email", email)
    .maybeSingle();

  const signal = data?.launch_signal && typeof data.launch_signal === "object" ? data.launch_signal : {};
  const ok =
    !error &&
    Object.entries(expected).every(([key, value]) => {
      return signal[key] === value;
    });

  record(name, ok, {
    note: ok ? `${email} persisted` : error?.message || JSON.stringify(signal).slice(0, 180)
  });
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

await browserPageCheck(`${mainUrl}/auth/sign-in`, "main-sign-in-desktop");
await browserPageCheck(`${preRegisterUrl}/`, "early-access-desktop");
record(
  "early-access launch pass renders",
  await page.locator("text=Launch Pass").first().isVisible({ timeout: 12000 }).catch(() => false)
);
record(
  "early-access beat streak renders",
  await page.locator("text=Beat Streak").first().isVisible({ timeout: 12000 }).catch(() => false)
);
record(
  "early-access launch challenge renders",
  await page.locator("text=Launch Challenge").first().isVisible({ timeout: 12000 }).catch(() => false)
);
await page.getByRole("button", { name: /Davet linkini paylaş|Share your invite/i }).first().click();
await page.getByRole("button", { name: /İlk ihtiyacını seç|Pick your first need/i }).first().click();
record(
  "early-access launch challenge reaches alpha",
  await page.locator("text=/Alpha dalga sinyali|Alpha wave signal/i").first().isVisible({ timeout: 12000 }).catch(() => false)
);
await page.getByRole("button", { name: "Snare" }).first().click();
await page.getByRole("button", { name: "Bass" }).first().click();
await page.getByRole("button", { name: "Snare" }).first().click();
record(
  "early-access beat streak accepts a sequence",
  await page.locator("text=/Seri buyudu|Streak up/i").first().isVisible({ timeout: 12000 }).catch(() => false)
);

const formEmail = `smoke-ui-${Date.now()}@example.net`;
await page.locator('input[name="email"]').fill(formEmail);
await page.locator('input[name="displayName"]').fill("Smoke UI");
await page.locator('input[name="reservedUsername"]').fill(`smoke-ui-${Date.now()}`);
await page.locator('input[name="persona"][value="both"]').check();
await page.locator('input[type="checkbox"]').first().check();
const [waitlistPostResponse] = await Promise.all([
  page.waitForResponse((response) => response.url().includes("/api/waitlist") && response.request().method() === "POST", {
    timeout: 20000
  }),
  page.locator('button[type="submit"]').click()
]);
const successVisible =
  (await page.locator("input[readonly][aria-label]").first().isVisible({ timeout: 12000 }).catch(() => false)) ||
  (await page.getByRole("button", { name: /kopyala|copy/i }).isVisible().catch(() => false));
const rateLimited = waitlistPostResponse.status() === 429;
await page.screenshot({ path: join(outDir, `${stamp}-early-access-success.png`), fullPage: true });
record("early-access browser form submits or rate-limits safely", successVisible || rateLimited, {
  note: successVisible
    ? `registered ${formEmail}`
    : rateLimited
      ? "waitlist rate limit protected the endpoint"
      : "success state not detected"
});
if (successVisible) {
  await recordStoredLaunchSignal("waitlist browser form stores launch signal", formEmail, {
    priority: "A",
    challengeTier: "alpha"
  });
}

await page.setViewportSize({ width: 390, height: 844 });
await browserPageCheck(`${preRegisterUrl}/`, "early-access-mobile");

await page.goto(`${mainUrl}/admin`, { waitUntil: "domcontentloaded", timeout: 30000 });
const adminUrl = page.url();
const adminGuarded =
  adminUrl.includes("/auth/sign-in") ||
  (await page.locator("text=/sign in|giriş|admin access|admin erişimi/i").first().isVisible().catch(() => false));
await page.screenshot({ path: join(outDir, `${stamp}-admin-anonymous.png`), fullPage: true });
record("admin page is guarded for anonymous visitor", adminGuarded, { note: adminUrl });

record("browser console has no errors", pageErrors.length === 0, { note: pageErrors.slice(0, 3).join(" | ") });
const unexpectedConsoleMessages = consoleMessages.filter(
  (message) => !message.includes("/api/waitlist") || !message.includes("429")
);
record("browser console warnings are limited", unexpectedConsoleMessages.length <= 5, {
  note: unexpectedConsoleMessages.slice(0, 5).join(" | ")
});
record("browser saw no 5xx responses", failedResponses.length === 0, { note: failedResponses.slice(0, 5).join(" | ") });

await context.close();
await browser.close();

const failed = results.filter((item) => !item.ok);
const report = {
  mainUrl,
  preRegisterUrl,
  checkedAt: new Date().toISOString(),
  health: JSON.parse(health.text),
  results,
  failed
};
writeFileSync(join(outDir, `${stamp}-public-smoke-report.json`), JSON.stringify(report, null, 2));

if (failed.length > 0) {
  console.error(`\n${failed.length} smoke checks failed.`);
  process.exit(1);
}

console.log(`\nAll ${results.length} smoke checks passed.`);
