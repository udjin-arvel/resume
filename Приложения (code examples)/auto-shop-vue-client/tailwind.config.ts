import type { Config } from "tailwindcss"
import theme from "tailwindcss/defaultTheme"
import forms from "@tailwindcss/forms"
import aspectRatio from "@tailwindcss/aspect-ratio"

export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./utils/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
    "./node_modules/vue-tailwind-datepicker/**/*.js",
  ],
  theme: {

    extend: {
      fontFamily: {
        sans: ["Mulish", ...theme.fontFamily.sans],
      },

      colors: {
        // Generate https://uicolors.app/create by #15449e
        primary: {
          DEFAULT: "#D51313",
          50: "#FFF5F6",
          100: "#FFE5E9",
          200: "#FFC7CF",
          300: "#FF9EAD",
          400: "#FF667D",
          500: "#DB0020",
          600: "#C7001E",
          700: "#AD001A",
          800: "#8F0015",
          900: "#66000F",
          950: "#57000D",
        },
        black: {
          DEFAULT: "#1A1117",
        },

        grey: {
          DEFAULT: "#6A6267",
          300: "#AFA7AC",
          500: "#3E2D38",
          900: "#ECE8DF",
          400: "#e6e6e6",
        },
        blue: {
          DEFAULT: "#0284c7",
          hover: "#38bdf8",
        },
        yellow: {
          DEFAULT: "#cf8e3c",
          100: "#fffbeb",
          200: "#fff1c2",
        },
        green: {
          DEFAULT: "#ebffee",
        },
      },
      keyframes: {
        swing: {
          "0%, 100%": { transform: "rotate(5deg)" },
          "50%": { transform: "rotate(0deg)" },
        },
        pulse: {
          "0%, 100%": { opacity: "0.05" },
          "50%": { opacity: ".6" },
        },
        rotate: {
          "0%": { transform: "rotate(-10deg)" },
          "50%": { transform: "rotate(10deg)" },
          "100%": { transform: "rotate(-10deg)" },
        },
      },
      animation: {
        "swing": "swing 2.5s ease-in-out infinite",
        "rotate": "rotate 6s linear infinite",
        "pulse": "pulse 1.5s ease-in-out infinite",
        "pulse-delayed-1": "pulse 1.5s ease-in-out 0.1s infinite",
        "pulse-delayed-2": "pulse 1.5s ease-in-out 0.2s infinite",
        "pulse-delayed-3": "pulse 1.5s ease-in-out 0.3s infinite",
        "pulse-delayed-4": "pulse 1.5s ease-in-out 0.4s infinite",
        "pulse-delayed-5": "pulse 1.5s ease-in-out 0.5s infinite",
        "pulse-delayed-6": "pulse 1.5s ease-in-out 0.6s infinite",
        "pulse-delayed-7": "pulse 1.5s ease-in-out 0.7s infinite",
      },
    },
  },
  variants: {
    extend: {
      opacity: ["disabled"],
    },
  },
  plugins: [
    forms,
    aspectRatio,
  ],
} satisfies Config
