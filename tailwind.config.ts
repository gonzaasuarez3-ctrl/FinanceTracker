import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12181B",
        paper: "#F6F4EF",
        moss: "#33473B",
        sage: "#7C9A83",
        clay: "#B5654B",
        gold: "#C9A15B",
        mist: "#E4E7E1",
        alert: "#B5654B",
        good: "#4C7A5E",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
