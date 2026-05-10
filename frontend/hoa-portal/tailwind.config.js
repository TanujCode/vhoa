/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light Mode Colors
        light: {
          bg: "#f8fafc",
          card: "#ffffff",
          border: "#e2e8f0",
          text: "#0f172a",
          textSecondary: "#64748b",
          hover: "#f1f5f9",
        },
        // Dark Mode Colors (already jo tum use kar rahe ho)
        dark: {
          bg: "#0D1B2A",
          card: "#162535",
          border: "#334155",
          text: "#f1f5f9",
          textSecondary: "#94a3b8",
        }
      }
    },
  },
  plugins: [],
}