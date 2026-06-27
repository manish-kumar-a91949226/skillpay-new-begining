/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0E0D",
          raised: "#111513",
          line: "#1E2422",
        },
        bone: {
          DEFAULT: "#E8E4DC",
          dim: "#9B968C",
          faint: "#5C5A54",
        },
        signal: {
          gold: "#D4A24C",
          "gold-dim": "#8A6B34",
          slate: "#5B8C8A",
          "slate-dim": "#3D5E5C",
          rust: "#B85C42",
        },
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        ledger: ["0.8125rem", { lineHeight: "1.3", letterSpacing: "0.01em" }],
      },
      letterSpacing: {
        tagwide: "0.14em",
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "3px",
      },
      animation: {
        "settle-scroll": "settle-scroll 28s linear infinite",
        "pulse-dot": "pulse-dot 2.2s ease-in-out infinite",
      },
      keyframes: {
        "settle-scroll": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.35 },
        },
      },
    },
  },
  plugins: [],
};
