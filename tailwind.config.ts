import type { Config } from "tailwindcss";

/**
 * Design System — Apotek Sehatku
 * Tema: Healthcare + Pharmacy + Modern Marketplace.
 * Mobile-first: spacing & touch target dirancang untuk layar 360–430px.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary: hijau/teal medis — tepercaya & profesional
        primary: {
          50: "#effcf9",
          100: "#d7f7f0",
          200: "#b0efe4",
          300: "#7de2d3",
          400: "#45cec0",
          500: "#26b5a9",
          600: "#16988f",
          700: "#137871",
          800: "#13615e",
          900: "#135150",
          950: "#082f2c",
        },
        surface: "#f7f9fb",
      },
      fontFamily: {
        // Roboto (bawaan Android) → terasa seperti aplikasi Android native
        sans: [
          "Roboto",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(15 42 56 / 0.08), 0 1px 2px -1px rgb(15 42 56 / 0.06)",
        nav: "0 -4px 16px -4px rgb(15 42 56 / 0.12)",
        sheet: "0 -12px 40px -12px rgb(15 42 56 / 0.28)",
      },
      keyframes: {
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(-12px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.92)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "sheet-up": "sheet-up 0.28s cubic-bezier(0.32, 0.72, 0.16, 1)",
        "fade-in": "fade-in 0.2s ease-out",
        "toast-in": "toast-in 0.22s cubic-bezier(0.32, 0.72, 0.16, 1)",
        "pop-in": "pop-in 0.18s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
