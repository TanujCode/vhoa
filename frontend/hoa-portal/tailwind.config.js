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
        // Override teal to be NestBloq Brand Logo Blue
        teal: {
          50: '#F0F7FF',
          100: '#E1EFFF',
          200: '#C2E0FF',
          300: '#94CBFF',
          400: '#74B9FF',
          500: '#3882F6', // Brand blue main
          600: '#1D68DF', // Brand corporate blue
          700: '#1A56BE',
          800: '#15459E',
          900: '#11357A',
          950: '#0A204C',
        },
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