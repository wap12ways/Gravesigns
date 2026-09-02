import type { Config } from "tailwindcss";

// Operator-tool palette: dark chrome, light dense work surface.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0d1117",
          800: "#161b22",
          700: "#21262d",
          600: "#30363d",
          500: "#484f58",
        },
        alpha: {
          DEFAULT: "#1f7a4d",
          dark: "#155c39",
          light: "#e8f4ee",
        },
      },
      fontSize: {
        "2xs": ["0.6875rem", "0.95rem"],
      },
    },
  },
  plugins: [],
};

export default config;
