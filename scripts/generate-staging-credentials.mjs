#!/usr/bin/env node
/**
 * Generates Basic Auth credentials for a gated test deployment.
 *
 * Prints the plaintext passwords ONCE (share them over a private channel) and
 * the STAGING_AUTH_USERS line, which contains only SHA-256 hashes and is the
 * only part that belongs in configuration.
 *
 * Usage: node scripts/generate-staging-credentials.mjs koraykurt hakanefe
 */
import { createHash, randomInt } from "node:crypto";

// Omits characters that are easy to confuse when typed by hand (0/O, 1/l/I).
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 24;

const names = process.argv.slice(2).filter(Boolean);
if (names.length === 0) {
  console.error("Usage: node scripts/generate-staging-credentials.mjs <username> [username...]");
  process.exit(1);
}

function generatePassword() {
  let password = "";
  // randomInt is CSPRNG-backed and free of the modulo bias that
  // Math.floor(Math.random() * n) would introduce.
  for (let index = 0; index < LENGTH; index += 1) {
    password += ALPHABET[randomInt(ALPHABET.length)];
  }
  return password;
}

const issued = names.map((name) => {
  const password = generatePassword();
  return {
    name,
    password,
    hash: createHash("sha256").update(password).digest("hex")
  };
});

console.log("\nCredentials — copy these now, they are not stored anywhere:\n");
for (const entry of issued) {
  console.log(`  ${entry.name}`);
  console.log(`  password: ${entry.password}\n`);
}

console.log("Add this line to .env.local (or the IIS environment). Hashes only:\n");
console.log(`STAGING_AUTH_USERS=${issued.map((e) => `${e.name}:${e.hash}`).join(",")}\n`);
console.log("Remove the variable to disable the gate.\n");
