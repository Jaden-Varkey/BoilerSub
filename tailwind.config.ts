import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./boilersub-frontend/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0052d0",
          coral: "#a03a0f",
          sand: "#f6efe8",
          ink: "#0f172a",
          mist: "#d7e5ff",
          gold: "#b08b3e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 24px 80px rgba(15, 23, 42, 0.12)",
      },
      backgroundImage: {
        "kinetic-grid":
          "linear-gradient(to right, rgba(0, 82, 208, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 82, 208, 0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
export default config;
