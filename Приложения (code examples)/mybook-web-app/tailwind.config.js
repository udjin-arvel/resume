/** @type {import('tailwindcss').Config} */
export default {
  content: [],
  theme: {
    extend: {
      colors: {
        dark: "#212121",
        black: "#121212",
        blacker: "#070707",
        beige: "#ddb089",
        beiger: "#e6c5a8",
        gold: "#e78c3d",
        golder: "#ee9e59",
        pink: "#f865bc",
        red: "#ff070e",
        reder: "#ff4b44",
        surface: "#1a1a1a",
        "surface-elevated": "#242424",
        "surface-muted": "#2c2c2c",
        "on-surface-muted": "#a8a8a8",
      },
      boxShadow: {
        "elevation-1": "0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)",
        "elevation-2": "0 3px 6px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25)",
        "elevation-3": "0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      maxWidth: {
        content: "900px",
      },
    },
  },
  plugins: [],
};
