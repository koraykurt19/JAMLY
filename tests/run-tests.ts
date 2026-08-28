import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { creators, listings } from "../src/lib/data";
import {
  categoryLabels,
  deliverySpeedLabels,
  jamMatchCategorySignals,
  listingCategories
} from "../src/lib/marketplace-config";
import {
  canUseProfileHeadline,
  isJamlyFounderAccount,
  isReservedFounderHeadline,
  JAMLY_FOUNDER_HEADLINE
} from "../src/lib/profile-policy";
import { findJamMatches } from "../src/lib/jam-match";
import { sanitizeExternalUrl, socialLinksFromRecord } from "../src/lib/social-links";
import {
  foundingTierFor,
  buildReferralUrl,
  normalizeEmail,
  normalizeReferralCode,
  sanitizeLaunchSignal,
  normalizeUsername,
  validateWaitlistSubmission
} from "../src/lib/waitlist";
import {
  allocateByPercentage,
  calculatePlatformFee,
  fromMinorUnits,
  toMinorUnits
} from "../src/lib/money";
import {
  allowedOrderTransitions,
  grantsDeliveryEntitlement,
  isTerminalOrderStatus
} from "../src/lib/order-status";
import { defaultPriorityFor, validateReport } from "../src/lib/reports";
import { sortBadgesForProfile, type ProfileBadge } from "../src/lib/badges";
import { assertUuid, sanitizeSearch } from "../src/lib/server/admin";
import { roleHas } from "../src/lib/admin-client";
import { createMailto, JAMLY_EMAILS } from "../src/lib/jamly-contacts";
import {
  allowedWaitlistTransitions,
  canTransitionWaitlistStatus,
  isAdminMutableWaitlistStatus,
  waitlistIntentBucket,
  waitlistIntentScore
} from "../src/lib/waitlist-admin";
import { betaAllowedHandleSet, isHandleBetaAllowed } from "../src/lib/beta-access";
import {
  buildBeatSequence,
  launchChallengeBenefit,
  launchChallengeTier,
  launchBenefitForScore,
  scoreBeatAttempt
} from "../src/lib/launch-mini-game";
import { planArtifactPrune } from "../src/lib/artifact-retention";
import {
  extractStorageReference,
  planStorageRetentionAudit
} from "../src/lib/storage-retention";

type TestCase = {
  name: string;
  run: () => void;
};

const retentionMigrationSql = () =>
  readFileSync(resolve(process.cwd(), "supabase/migrations/20260828_retention_controls.sql"), "utf8");
const retentionPlanActionSql = () =>
  readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260828_admin_retention_plan_actions.sql"),
    "utf8"
  );
const betaAccessSql = () =>
  readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260828_beta_access_controls.sql"),
    "utf8"
  );
const waitlistLaunchSignalSql = () =>
  readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260828_waitlist_launch_signal.sql"),
    "utf8"
  );
const retentionSelfReadSql = () =>
  readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260828_profile_retention_self_read.sql"),
    "utf8"
  );

const uiSourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = resolve(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) return uiSourceFiles(path);
    return /\.(ts|tsx|mjs|md)$/.test(path) ? [path] : [];
  });

const tests: TestCase[] = [
  {
    name: "Jamly contact routes build encoded mailto links",
    run() {
      assert.equal(JAMLY_EMAILS.noreply, "noreply@getjamly.com");
      assert.equal(
        createMailto(JAMLY_EMAILS.payment, { subject: "Order #42" }),
        "mailto:payment@getjamly.com?subject=Order+%2342"
      );
    }
  },
  {
    name: "marketplace config keeps labels in sync with categories",
    run() {
      assert.deepEqual(
        [...listingCategories].sort(),
        Object.keys(categoryLabels.tr).sort()
      );
      assert.deepEqual(
        Object.keys(categoryLabels.tr).sort(),
        Object.keys(categoryLabels.en).sort()
      );
      assert.deepEqual(
        Object.keys(deliverySpeedLabels.tr).sort(),
        Object.keys(deliverySpeedLabels.en).sort()
      );
      assert.ok(jamMatchCategorySignals["guitar-riff"].categories.includes("Guitar"));
    }
  },
  {
    name: "Jam Match keeps guitar custom work discoverable",
    run() {
      const results = findJamMatches(
        {
          prompt: "need a guitar riff for a pop r&b single",
          categoryIds: ["guitar-riff"],
          genreId: "r-and-b",
          budget: { min: 0, max: 500 },
          deadlineId: "flexible",
          workType: "custom",
          language: "en"
        },
        listings,
        creators
      );

      assert.ok(
        results.some((result) => result.listingId === "neon-session-guitar"),
        "expected Neon Session Guitar to remain a valid Jam Match result"
      );
    }
  },
  {
    name: "Jam Match keeps trap beat ready-made discovery intact",
    run() {
      const results = findJamMatches(
        {
          prompt: "dark trap beat around 140 bpm",
          categoryIds: ["beat"],
          genreId: "trap",
          budget: { min: 0, max: 200 },
          deadlineId: "3-days",
          workType: "ready",
          language: "en"
        },
        listings,
        creators
      );

      assert.ok(
        results.some((result) => result.listingId === "night-shift-bounce"),
        "expected Night Shift Bounce to remain a valid Jam Match result"
      );
    }
  },
  {
    name: "reserved founder headline remains protected",
    run() {
      assert.equal(isReservedFounderHeadline(JAMLY_FOUNDER_HEADLINE), true);
      assert.equal(isJamlyFounderAccount("koraykurt.vrdn@gmail.com"), true);
      assert.equal(canUseProfileHeadline(JAMLY_FOUNDER_HEADLINE, "buyer@example.com"), false);
      assert.equal(canUseProfileHeadline(JAMLY_FOUNDER_HEADLINE, "koraykurt.vrdn@gmail.com"), true);
    }
  },
  {
    name: "social links reject active URL schemes",
    run() {
      assert.equal(sanitizeExternalUrl("javascript:alert(1)"), "");
      assert.equal(sanitizeExternalUrl("data:text/html,<script>alert(1)</script>"), "");
      assert.equal(sanitizeExternalUrl("https://example.com/path"), "https://example.com/path");

      const links = socialLinksFromRecord({
        website: "javascript:alert(1)",
        instagram: "https://instagram.com/jamly"
      });

      assert.equal(links.length, 1);
      assert.equal(links[0]?.platform, "instagram");
    }
  },

  // --- Waitlist -----------------------------------------------------------
  {
    name: "waitlist rejects malformed emails and missing consent",
    run() {
      const base = {
        email: "producer@example.com",
        persona: "creator" as const,
        interests: [],
        locale: "tr" as const,
        acceptedTerms: true,
        marketingOptIn: false
      };

      assert.equal(validateWaitlistSubmission(base).length, 0);

      const noConsent = validateWaitlistSubmission({ ...base, acceptedTerms: false });
      assert.ok(noConsent.some((error) => error.code === "terms_required"));

      for (const email of ["", "no-at-sign", "two@@at.com", "trailing@dot."]) {
        const errors = validateWaitlistSubmission({ ...base, email });
        assert.ok(
          errors.some((error) => error.code === "invalid_email"),
          `expected ${email} to be rejected`
        );
      }
    }
  },
  {
    name: "waitlist normalizes email and username so duplicates collide",
    run() {
      assert.equal(normalizeEmail("  Producer@Example.COM "), "producer@example.com");
      assert.equal(normalizeUsername("  @Jamly-Producer "), "jamly-producer");

      // Reserved usernames must fail the shape check before reaching the database.
      const errors = validateWaitlistSubmission({
        email: "a@b.co",
        reservedUsername: "Bad Username!",
        persona: "both",
        interests: [],
        locale: "en",
        acceptedTerms: true,
        marketingOptIn: false
      });
      assert.ok(errors.some((error) => error.code === "invalid_username"));
    }
  },
  {
    name: "referral codes are normalized or discarded, never trusted raw",
    run() {
      assert.equal(normalizeReferralCode("abc123def0"), "ABC123DEF0");
      assert.equal(normalizeReferralCode(" ab-c1 23de "), "ABC123DE");
      assert.equal(normalizeReferralCode("ab"), undefined);
      assert.equal(normalizeReferralCode(null), undefined);

      // The safety property is that whatever survives is alphanumeric only, so
      // it can never carry SQL or filter syntax into a lookup. A hostile string
      // may still be shaped like a code — it simply will not match one.
      const hostile = normalizeReferralCode("'; drop table users; --");
      assert.ok(hostile === undefined || /^[A-Z0-9]{6,16}$/.test(hostile));
      assert.ok(!(hostile ?? "").includes(";"));
      assert.ok(!(hostile ?? "").includes(" "));
    }
  },
  {
    name: "founding tier boundaries match the badge rules",
    run() {
      assert.equal(foundingTierFor(1), "first_100");
      assert.equal(foundingTierFor(100), "first_100");
      assert.equal(foundingTierFor(101), "first_1000");
      assert.equal(foundingTierFor(1000), "first_1000");
      assert.equal(foundingTierFor(1001), "community");
    }
  },
  {
    name: "admin and pre-register UI sources do not contain UTF-8 mojibake",
    run() {
      const files = [
        ...uiSourceFiles(resolve(process.cwd(), "src", "components", "admin")),
        ...uiSourceFiles(resolve(process.cwd(), "src", "app", "admin")),
        ...uiSourceFiles(resolve(process.cwd(), "src", "app", "early-access"))
      ];

      for (const file of files) {
        const source = readFileSync(file, "utf8");
        assert.equal(
          /Ã|Ä|Å|�/.test(source),
          false,
          `${file} contains likely mojibake`
        );
      }
    }
  },
  {
    name: "waitlist referral links stay on the pre-register root",
    run() {
      assert.equal(
        buildReferralUrl("https://pre-register.getjamly.com", "ABC123"),
        "https://pre-register.getjamly.com/?ref=ABC123"
      );
    }
  },
  {
    name: "waitlist launch signal is sanitized before persistence",
    run() {
      assert.deepEqual(
        sanitizeLaunchSignal({
          priority: "A",
          role: "both",
          need: "collab",
          readiness: "ready",
          beatScore: 240.8,
          beatRounds: 4,
          challengeTier: "alpha",
          completedChallenges: ["profile", "drop", "referral", "unknown"],
          extra: "discard"
        }),
        {
          priority: "A",
          role: "both",
          need: "collab",
          readiness: "ready",
          challengeTier: "alpha",
          beatScore: 240,
          beatRounds: 4,
          completedChallenges: ["profile", "drop", "referral"]
        }
      );
      assert.deepEqual(sanitizeLaunchSignal({ priority: "Z", beatScore: 999999 }), {});
    }
  },
  {
    name: "pre-register beat streak mini-game scores only exact sequences",
    run() {
      const first = buildBeatSequence(1);
      assert.deepEqual(first, ["snare", "bass", "snare"]);

      const partial = scoreBeatAttempt(first.slice(0, 2), ["snare", "bass"]);
      assert.equal(partial.correct, true);
      assert.equal(partial.completed, true);

      const miss = scoreBeatAttempt(first, ["snare", "kick", "snare"]);
      assert.equal(miss.correct, false);
      assert.equal(miss.points, 0);

      const hit = scoreBeatAttempt(first, first);
      assert.equal(hit.correct, true);
      assert.equal(hit.completed, true);
      assert.equal(hit.points, 360);
    }
  },
  {
    name: "pre-register beat streak benefit tiers remain stable",
    run() {
      assert.equal(launchBenefitForScore(0, "en"), "Founding list signal");
      assert.equal(launchBenefitForScore(1200, "en"), "Early wave priority");
      assert.equal(launchBenefitForScore(2400, "en"), "Studio Alpha badge");
      assert.equal(launchBenefitForScore(1200, "tr"), "Erken dalga onceligi");
    }
  },
  {
    name: "pre-register launch challenge tiers remain stable",
    run() {
      assert.equal(launchChallengeTier([]), "starter");
      assert.equal(launchChallengeTier(["profile"]), "warm");
      assert.equal(launchChallengeTier(["profile", "referral"]), "priority");
      assert.equal(launchChallengeTier(["profile", "referral", "drop"]), "alpha");
      assert.equal(launchChallengeTier(["profile", "profile", "drop"]), "priority");
      assert.equal(launchChallengeBenefit("alpha", "en"), "Alpha wave signal");
      assert.equal(launchChallengeBenefit("priority", "tr"), "Oncelikli davet sinyali");
    }
  },

  // --- Money --------------------------------------------------------------
  {
    name: "money converts to minor units without float drift",
    run() {
      assert.equal(toMinorUnits(24.99), 2499);
      assert.equal(toMinorUnits(0.1), 10);
      assert.equal(toMinorUnits(0.29), 29);
      assert.equal(toMinorUnits(1.005), 101);
      assert.equal(toMinorUnits(0), 0);
      assert.equal(fromMinorUnits(2499), 24.99);
      assert.throws(() => toMinorUnits(-1));
      assert.throws(() => toMinorUnits(Number.NaN));
    }
  },
  {
    name: "revenue splits always reconcile to the total",
    run() {
      // 100 / 3 cannot divide evenly; naive rounding loses or invents a cent.
      const thirds = allocateByPercentage(10_000, [
        { id: "a", percent: 33.33 },
        { id: "b", percent: 33.33 },
        { id: "c", percent: 33.34 }
      ]);
      assert.equal(
        thirds.reduce((sum, entry) => sum + entry.amountMinor, 0),
        10_000
      );

      const awkward = allocateByPercentage(1, [
        { id: "a", percent: 50 },
        { id: "b", percent: 50 }
      ]);
      assert.equal(awkward.reduce((sum, entry) => sum + entry.amountMinor, 0), 1);

      const single = allocateByPercentage(2499, [{ id: "solo", percent: 100 }]);
      assert.equal(single[0].amountMinor, 2499);

      assert.deepEqual(allocateByPercentage(500, []), []);
    }
  },
  {
    name: "platform fee honours the configured minimum",
    run() {
      assert.equal(calculatePlatformFee(10_000), 1000);
      // A tiny sale still pays the floor rather than rounding to zero.
      assert.equal(calculatePlatformFee(100), 100);
      assert.equal(calculatePlatformFee(2499), 250);
    }
  },

  // --- Order state machine ------------------------------------------------
  {
    name: "buyers can only cancel, never deliver their own order",
    run() {
      // This was a real vulnerability: the buyer could set `delivered`, which
      // minted revenue splits for a project they did not own.
      assert.deepEqual(allowedOrderTransitions("requested", "buyer"), ["cancelled"]);
      assert.deepEqual(allowedOrderTransitions("in_review", "buyer"), ["cancelled"]);
      assert.ok(!allowedOrderTransitions("in_review", "buyer").includes("delivered"));
      assert.ok(allowedOrderTransitions("in_review", "creator").includes("delivered"));
    }
  },
  {
    name: "terminal orders cannot be reopened by either party",
    run() {
      for (const role of ["creator", "buyer"] as const) {
        assert.deepEqual(allowedOrderTransitions("delivered", role), []);
        assert.deepEqual(allowedOrderTransitions("cancelled", role), []);
      }
      assert.ok(isTerminalOrderStatus("delivered"));
      assert.ok(!isTerminalOrderStatus("requested"));
    }
  },
  {
    name: "delivery entitlement requires settled payment",
    run() {
      assert.ok(grantsDeliveryEntitlement("paid", "delivered"));
      assert.ok(grantsDeliveryEntitlement("paid", "requested"));
      // Unpaid orders previously granted downloads immediately.
      assert.ok(!grantsDeliveryEntitlement("unpaid", "delivered"));
      assert.ok(!grantsDeliveryEntitlement("processing", "in_review"));
      assert.ok(!grantsDeliveryEntitlement("refunded", "delivered"));
      assert.ok(!grantsDeliveryEntitlement("paid", "cancelled"));
    }
  },

  // --- Reports ------------------------------------------------------------
  {
    name: "report validation enforces a usable description",
    run() {
      const base = {
        targetType: "listing" as const,
        targetId: "abc",
        category: "copyright" as const,
        description: "This beat uses my melody without permission."
      };
      assert.deepEqual(validateReport(base), []);
      assert.ok(validateReport({ ...base, description: "short" }).includes("description_too_short"));
      assert.ok(
        validateReport({ ...base, description: "x".repeat(2001) }).includes("description_too_long")
      );
    }
  },
  {
    name: "harmful report categories escalate on arrival",
    run() {
      assert.equal(defaultPriorityFor("harassment"), "urgent");
      assert.equal(defaultPriorityFor("fraud"), "urgent");
      assert.equal(defaultPriorityFor("copyright"), "high");
      assert.equal(defaultPriorityFor("spam"), "normal");
    }
  },

  // --- Badges -------------------------------------------------------------
  {
    name: "verification badges sort ahead of achievements",
    run() {
      const badge = (key: string, category: ProfileBadge["category"], order: number) =>
        ({
          key,
          nameTr: key,
          nameEn: key,
          descriptionTr: "",
          descriptionEn: "",
          category,
          rarity: "common",
          icon: "award",
          tone: "brand",
          awardedAt: "2026-01-01",
          displayOrder: order
        }) satisfies ProfileBadge;

      const sorted = sortBadgesForProfile([
        badge("first_sale", "marketplace", 1),
        badge("community", "community", 1),
        badge("verified", "verification", 99),
        badge("founding", "early_access", 1)
      ]);

      assert.deepEqual(
        sorted.map((item) => item.key),
        ["verified", "founding", "first_sale", "community"]
      );
    }
  },

  // --- Admin authorization ------------------------------------------------
  {
    name: "admin search strips PostgREST filter metacharacters",
    run() {
      // Commas and parens would break out of an .or() filter expression.
      assert.equal(sanitizeSearch("jam,ly(evil)"), "jam ly evil");
      assert.equal(sanitizeSearch("  spaced   out  "), "spaced out");
      assert.equal(sanitizeSearch("user@example.com"), "user@example.com");
      assert.equal(sanitizeSearch(null), "");
      assert.equal(sanitizeSearch("x".repeat(200)).length, 80);
    }
  },
  {
    name: "admin id validation rejects non-uuid input",
    run() {
      assert.doesNotThrow(() => assertUuid("3f2504e0-4f89-41d3-9a0c-0305e82c3301"));
      for (const value of ["", "not-a-uuid", "3f2504e0-4f89-41d3-9a0c", "'; drop table --"]) {
        assert.throws(() => assertUuid(value), `expected ${value} to be rejected`);
      }
    }
  },
  {
    name: "admin roles cannot exceed their capability set",
    run() {
      // Menu hiding is not authorization, but the mirrored table must still
      // match the database so the console never offers a forbidden action.
      assert.ok(roleHas("super_admin", "admin.manage"));
      assert.ok(!roleHas("admin", "admin.manage"));
      assert.ok(!roleHas("moderator", "finance.manage"));
      assert.ok(!roleHas("support", "badge.manage"));
      assert.ok(!roleHas("analyst", "user.moderate"));
      assert.ok(roleHas("moderator", "report.resolve"));
      assert.ok(!roleHas(null, "user.view"));
    }
  },
  {
    name: "admin waitlist actions preserve the pre-register gate",
    run() {
      assert.deepEqual(allowedWaitlistTransitions("pending"), [
        "verified",
        "suppressed",
        "blocked"
      ]);
      assert.ok(canTransitionWaitlistStatus("verified", "invited"));
      assert.ok(canTransitionWaitlistStatus("blocked", "verified"));
      assert.ok(!canTransitionWaitlistStatus("converted", "verified"));
      assert.ok(!isAdminMutableWaitlistStatus("converted"));
      assert.ok(isAdminMutableWaitlistStatus("invited"));
    }
  },
  {
    name: "admin waitlist intent scoring prioritizes safe high-signal entries",
    run() {
      const highSignal = waitlistIntentScore({
        status: "verified",
        persona: "both",
        referral_count: 4,
        risk_flags: [],
        verified_at: "2026-08-28T00:00:00.000Z"
      });
      const risky = waitlistIntentScore({
        status: "verified",
        persona: "both",
        referral_count: 4,
        risk_flags: ["disposable_email"],
        verified_at: "2026-08-28T00:00:00.000Z"
      });
      const blocked = waitlistIntentScore({
        status: "blocked",
        persona: "creator",
        referral_count: 8,
        risk_flags: ["manual_review"],
        verified_at: null
      });

      assert.equal(waitlistIntentBucket(highSignal), "high");
      assert.ok(risky < highSignal);
      assert.equal(waitlistIntentBucket(blocked), "cold");
    }
  },
  {
    name: "beta allowlist handles normalize consistently",
    run() {
      const handles = betaAllowedHandleSet(" KorayKurt, hakanefe ,, JamlyBuyer ");
      assert.ok(handles.has("koraykurt"));
      assert.ok(handles.has("hakanefe"));
      assert.ok(handles.has("jamlybuyer"));
      assert.equal(handles.size, 3);
      assert.ok(isHandleBetaAllowed(" KORAYKURT "));
      assert.ok(!isHandleBetaAllowed("randomuser"));
    }
  },

  // --- Retention ----------------------------------------------------------
  {
    name: "retention cleanup never targets durable identity or money tables",
    run() {
      const sql = retentionMigrationSql().toLowerCase();
      const forbiddenDeleteTargets = [
        "profiles",
        "auth.users",
        "admin_accounts",
        "admin_audit_log",
        "order_requests",
        "payments",
        "ledger_entries",
        "revenue_splits",
        "reports"
      ];

      for (const table of forbiddenDeleteTargets) {
        const deletePattern = new RegExp(`delete\\s+from\\s+(?:public\\.)?${table.replace(".", "\\.")}\\b`);
        assert.ok(!deletePattern.test(sql), `retention must not delete from ${table}`);
        assert.ok(sql.includes(`'${table}'`), `retention summary must name ${table} as protected`);
      }
    }
  },
  {
    name: "retention cleanup only deletes approved ephemeral data",
    run() {
      const sql = retentionMigrationSql().toLowerCase();
      const allowedDeleteTargets = [
        "rate_limit_counters",
        "waitlist_events",
        "notifications",
        "messages",
        "conversations"
      ];
      const deleteTargets = [...sql.matchAll(/delete\s+from\s+(?:public\.)?([a-z_]+)/g)].map(
        (match) => match[1]
      );

      assert.ok(deleteTargets.length > 0, "retention migration should include execute-mode deletes");
      assert.deepEqual(
        [...new Set(deleteTargets)].sort(),
        allowedDeleteTargets.sort()
      );
      assert.ok(
        sql.includes("c.order_request_id is null"),
        "non-order conversation guard must stay in message/conversation pruning"
      );
    }
  },
  {
    name: "premium retention doubles user-facing ephemeral windows",
    run() {
      const sql = retentionMigrationSql();

      assert.ok(sql.includes("retention_multiplier >= 1"));
      assert.ok(sql.includes("retention_multiplier <= 4"));
      assert.ok(sql.includes("'premiumRetentionDays', read_notification_base_days * 2"));
      assert.ok(sql.includes("'premiumRetentionDays', unread_notification_base_days * 2"));
      assert.ok(sql.includes("'premiumRetentionDays', message_base_days * 2"));
      assert.ok(sql.includes("'premiumRetentionDays', 60"));
    }
  },
  {
    name: "admin retention plan changes are guarded and audited",
    run() {
      const sql = retentionPlanActionSql();

      assert.ok(sql.includes("public.admin_has('admin.manage')"));
      assert.ok(sql.includes("p_plan not in ('standard', 'premium')"));
      assert.ok(sql.includes("A reason is required to change retention plans"));
      assert.ok(sql.includes("when p_plan = 'premium' then 2 else 1"));
      assert.ok(sql.includes("'retention.plan_change'"));
      assert.ok(sql.includes("perform public.record_admin_action"));
      assert.ok(sql.includes("grant execute on function public.admin_set_retention_plan"));
    }
  },
  {
    name: "admin beta access changes are explicit, guarded, and audited",
    run() {
      const sql = betaAccessSql();

      assert.ok(sql.includes("create table if not exists public.profile_beta_access"));
      assert.ok(sql.includes("profile_id = auth.uid()"));
      assert.ok(sql.includes("public.admin_has('admin.manage')"));
      assert.ok(sql.includes("A reason is required to change beta access"));
      assert.ok(sql.includes("'beta.access_change'"));
      assert.ok(sql.includes("perform public.record_admin_action"));
      assert.ok(sql.includes("grant execute on function public.admin_set_beta_access"));
      assert.ok(!/waitlist_entries[\s\S]+references public\.profile_beta_access/i.test(sql));
    }
  },
  {
    name: "waitlist launch signals are stored as bounded metadata only",
    run() {
      const sql = waitlistLaunchSignalSql();

      assert.ok(sql.includes("add column if not exists launch_signal jsonb"));
      assert.ok(sql.includes("jsonb_typeof(launch_signal) = 'object'"));
      assert.ok(sql.includes("p_launch_signal jsonb default '{}'::jsonb"));
      assert.ok(sql.includes("clean_launch_signal"));
      assert.ok(sql.includes("'launch_signal', clean_launch_signal"));
      assert.ok(!/grant\s+select\s+on\s+public\.waitlist_entries\s+to\s+anon/i.test(sql));
    }
  },
  {
    name: "members can only read their own retention settings",
    run() {
      const sql = retentionSelfReadSql();

      assert.ok(sql.includes("for select"));
      assert.ok(sql.includes("profile_id = auth.uid()"));
      assert.ok(sql.includes("public.admin_has('admin.manage')"));
      assert.ok(!/for\s+(insert|update|delete|all)/i.test(sql));
    }
  },

  // --- VDS artifact retention --------------------------------------------
  {
    name: "smoke artifact pruning removes expired files first",
    run() {
      const day = 24 * 60 * 60 * 1000;
      const nowMs = Date.UTC(2026, 7, 28);
      const plan = planArtifactPrune(
        [
          { path: "fresh.png", sizeBytes: 10, modifiedAtMs: nowMs - day },
          { path: "old.png", sizeBytes: 10, modifiedAtMs: nowMs - 10 * day }
        ],
        { nowMs, keepDays: 7, maxBytes: 100 }
      );

      assert.deepEqual(plan.keepFiles.map((file) => file.path), ["fresh.png"]);
      assert.deepEqual(plan.deleteFiles.map((file) => file.path), ["old.png"]);
    }
  },
  {
    name: "smoke artifact pruning respects the total size budget",
    run() {
      const nowMs = Date.UTC(2026, 7, 28);
      const plan = planArtifactPrune(
        [
          { path: "newest.png", sizeBytes: 60, modifiedAtMs: nowMs },
          { path: "middle.png", sizeBytes: 60, modifiedAtMs: nowMs - 1 },
          { path: "oldest.png", sizeBytes: 20, modifiedAtMs: nowMs - 2 }
        ],
        { nowMs, keepDays: 7, maxBytes: 100 }
      );

      assert.deepEqual(plan.keepFiles.map((file) => file.path), ["newest.png", "oldest.png"]);
      assert.deepEqual(plan.deleteFiles.map((file) => file.path), ["middle.png"]);
      assert.equal(plan.keptBytes, 80);
      assert.equal(plan.deletedBytes, 60);
    }
  },
  {
    name: "storage retention audit protects referenced media and flags old orphans",
    run() {
      const now = Date.parse("2026-08-28T00:00:00Z");
      const recent = now - 6 * 60 * 60 * 1000;
      const old = now - 4 * 24 * 60 * 60 * 1000;
      const plan = planStorageRetentionAudit(
        [
          {
            bucket: "profile-media",
            name: "user/avatar.png",
            sizeBytes: 10,
            createdAtMs: old,
            updatedAtMs: old
          },
          {
            bucket: "audio-previews",
            name: "user/orphan.mp3",
            sizeBytes: 20,
            createdAtMs: old,
            updatedAtMs: old
          },
          {
            bucket: "collab-files",
            name: "project/recent.wav",
            sizeBytes: 30,
            createdAtMs: recent,
            updatedAtMs: recent
          },
          {
            bucket: "unknown",
            name: "leave-alone.bin",
            sizeBytes: 40,
            createdAtMs: old,
            updatedAtMs: old
          }
        ],
        [{ bucket: "profile-media", name: "user/avatar.png", reason: "profile avatar" }],
        { nowMs: now, orphanGraceDays: 2 }
      );

      assert.equal(plan.inspectedObjects, 3);
      assert.equal(plan.ignoredObjects, 1);
      assert.equal(plan.protectedObjects, 1);
      assert.equal(plan.orphanObjects, 2);
      assert.equal(plan.deletionCandidates, 1);
      assert.deepEqual(plan.deletionCandidateObjects, [
        {
          bucket: "audio-previews",
          name: "user/orphan.mp3",
          sizeBytes: 20
        }
      ]);
      assert.deepEqual(plan.sampleCandidates[0], {
        bucket: "audio-previews",
        name: "user/orphan.mp3",
        sizeBytes: 20
      });
    }
  },
  {
    name: "storage retention audit extracts Supabase public URLs and private paths",
    run() {
      assert.deepEqual(
        extractStorageReference(
          "https://x.supabase.co/storage/v1/object/public/listing-covers/user%201/cover.png"
        ),
        {
          bucket: "listing-covers",
          name: "user 1/cover.png",
          reason: "public URL reference"
        }
      );
      assert.deepEqual(
        extractStorageReference("creator/listing/mp3/file.zip", "license-deliverables"),
        {
          bucket: "license-deliverables",
          name: "creator/listing/mp3/file.zip",
          reason: "database path reference"
        }
      );
      assert.equal(extractStorageReference("https://example.com/image.png"), null);
    }
  }
];

// Run every test even when one fails: a fail-fast loop hides how much else is
// broken, which is exactly what you need to know during a release check.
const failures: { name: string; error: unknown }[] = [];

for (const test of tests) {
  try {
    test.run();
    process.stdout.write(`PASS ${test.name}\n`);
  } catch (error) {
    failures.push({ name: test.name, error });
    process.stdout.write(`FAIL ${test.name}\n`);
  }
}

if (failures.length > 0) {
  process.stdout.write(`\n${failures.length} of ${tests.length} tests failed:\n`);
  for (const failure of failures) {
    const message = failure.error instanceof Error ? failure.error.message : String(failure.error);
    process.stdout.write(`\n  ${failure.name}\n    ${message.split("\n").join("\n    ")}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`\n${tests.length} tests passed.\n`);
}
