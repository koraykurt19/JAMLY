import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [".next/**", ".next-backup-*/**", ".test-build/**", "out/**", "dist/**", "build/**", "coverage/**"]
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // The codebase intentionally loads data via setState inside effects.
      "react-hooks/set-state-in-effect": "off"
    }
  }
];

export default config;
