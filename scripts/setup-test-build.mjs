import { mkdirSync, symlinkSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const linkDir = resolve(".test-build/node_modules/@");
const linkPath = resolve(linkDir, "lib");
const target = resolve(".test-build/src/lib");

mkdirSync(linkDir, { recursive: true });
if (!existsSync(linkPath)) {
  // "junction" works without elevated privileges on Windows; ignored elsewhere.
  symlinkSync(target, linkPath, "junction");
}
