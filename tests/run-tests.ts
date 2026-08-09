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

type TestCase = {
  name: string;
  run: () => void;
};

const tests: TestCase[] = [
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
  }
];

for (const test of tests) {
  test.run();
  process.stdout.write(`PASS ${test.name}\n`);
}

process.stdout.write(`\n${tests.length} tests passed.\n`);
