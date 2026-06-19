import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        jam: {
          ink: "#050608",
          panel: "#0d1016",
          line: "#202632",
          mint: "#58c5ff",
          blue: "#7aa7ff",
          coral: "#ff6b75",
          gold: "#ffcc66"
        }
      },
      boxShadow: {
        glow: "0 0 50px rgba(88, 197, 255, 0.18)",
        soft: "0 24px 80px rgba(0, 0, 0, 0.35)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      opacity: {
        "8": "0.08",
        "12": "0.12",
        "14": "0.14",
        "15": "0.15",
        "18": "0.18",
        "24": "0.24",
        "28": "0.28",
        "30": "0.3",
        "35": "0.35",
        "36": "0.36",
        "38": "0.38",
        "42": "0.42",
        "45": "0.45",
        "46": "0.46",
        "48": "0.48",
        "50": "0.5",
        "52": "0.52",
        "54": "0.54",
        "56": "0.56",
        "58": "0.58",
        "60": "0.6",
        "62": "0.62",
        "64": "0.64",
        "66": "0.66",
        "68": "0.68",
        "70": "0.7",
        "72": "0.72",
        "78": "0.78",
        "80": "0.8",
        "82": "0.82",
        "84": "0.84"
      }
    }
  },
  plugins: []
};

export default config;
