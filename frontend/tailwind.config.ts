import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        carvao: { DEFAULT: "#17120F", 800: "#201A16", 700: "#2B231E", 600: "#3A302A" },
        brasa: { DEFAULT: "#D4561A", 600: "#B84614", 300: "#F08A55" },
        cobre: { DEFAULT: "#C0813F", 300: "#DDA668" },
        vinho: { DEFAULT: "#7A1E1E", 400: "#A33232" },
        osso: "#EFE8DD",
        fumaca: "#A8A097",
      },
      fontFamily: {
        display: ['"Big Shoulders Display Variable"', "Impact", "sans-serif"],
        sans: ['"Figtree Variable"', "system-ui", "sans-serif"],
      },
      keyframes: {
        slideIn: { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        pop: { from: { opacity: "0", transform: "scale(.97)" }, to: { opacity: "1", transform: "scale(1)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        slideIn: "slideIn .28s cubic-bezier(.2,.8,.2,1)",
        pop: "pop .18s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
