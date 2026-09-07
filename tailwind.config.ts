import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sidebar: "var(--sidebar)",
        brand: {
          beegroup: "#f59e0b", // BeeGroup yellow/amber
          mysafar: "#0284c7",  // MySafar blue/cyan
          unired: "#dc2626",   // Unired red/crimson
        }
      },
    },
  },
  plugins: [],
};

export default config;
