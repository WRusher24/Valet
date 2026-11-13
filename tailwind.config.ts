import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FFFFFF",
        surface: "#FAF9F6",
        obsidian: "#050206",
        charcoal: "#3B3B3B",
        bronze: "#9A8174",
      },
      fontFamily: {
        display: ['"Playfair Display Variable"', "Georgia", "serif"],
        sans: ['"Inter Variable"', "system-ui", "sans-serif"],
      },
      letterSpacing: { editorial: "0.18em" },
    },
  },
  plugins: [],
};

export default config;
