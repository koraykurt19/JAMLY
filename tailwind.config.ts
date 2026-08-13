import type { Config } from "tailwindcss";

/**
 * Reads a canonical "R G B" channel token from globals.css so that Tailwind
 * alpha modifiers (e.g. `bg-jam-blue/20`) keep working.
 */
function token(name: string) {
  return `rgb(var(${name}) / <alpha-value>)`;
}

/** Every integer percentage 0-100, so no `/NN` utility can silently no-op. */
function completeOpacityScale() {
  const scale: Record<string, string> = {};
  for (let value = 0; value <= 100; value += 1) {
    scale[String(value)] = String(value / 100);
  }
  return scale;
}

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Sourced from the canonical tokens in src/app/globals.css.
        // Never hardcode a hex here — edit the CSS variable instead.
        jam: {
          ink: token("--c-ink"),
          panel: token("--c-panel"),
          surface: token("--c-surface"),
          raised: token("--c-raised"),
          hover: token("--c-hover"),
          line: token("--c-line"),
          mint: token("--c-mint"),
          blue: token("--c-blue"),
          coral: token("--c-coral"),
          gold: token("--c-gold"),
          success: token("--c-success"),
          danger: token("--c-danger"),
          warning: token("--c-warning")
        },
        content: {
          DEFAULT: token("--c-text"),
          secondary: token("--c-text-secondary"),
          muted: token("--c-text-muted")
        }
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "var(--radius-pill)"
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        soft: "var(--shadow-soft)",
        panel: "var(--shadow-panel)"
      },
      minHeight: {
        control: "var(--control-height-md)",
        "control-sm": "var(--control-height-sm)",
        "control-lg": "var(--control-height-lg)"
      },
      fontFamily: {
        sans: [
          "Neue Montreal",
          "NeueMontreal",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      },
      // A hand-maintained list silently dropped 12 in-use values (bg-white/7,
      // text-white/44, bg-black/22 ...), so those utilities emitted no CSS at
      // all — invisible skeletons and transparent chips. A complete scale makes
      // that class of bug impossible.
      opacity: completeOpacityScale()
    }
  },
  plugins: []
};

export default config;
