import assert from "node:assert/strict";
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
  isAdminMutableWaitlistStatus
} from "../src/lib/waitlist-admin";
import { betaAllowedHandleSet, isHandleBetaAllowed } from "../src/lib/beta-access";

type TestCase = {
  name: string;
  run: () => void;
};

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
    name: "waitlist referral links stay on the pre-register root",
    run() {
      assert.equal(
        buildReferralUrl("https://pre-register.getjamly.com", "ABC123"),
        "https://pre-register.getjamly.com/?ref=ABC123"
      );
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
