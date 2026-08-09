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
          ink: "#080A0F",
          panel: "#0D1118",
          surface: "#121722",
          raised: "#171D29",
          hover: "#1C2432",
          line: "#252C39",
          mint: "#76B4FF",
          blue: "#4D7CFF",
          coral: "#FF6B7A",
          gold: "#F4B860",
          success: "#42D6A4"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(77, 124, 255, 0.16)",
        soft: "0 20px 60px rgba(0, 0, 0, 0.32)"
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
