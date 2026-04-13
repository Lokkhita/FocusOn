/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  // 'class' strategy: toggle dark mode by adding/removing 'dark' class on <html>
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // Display font: bold, editorial feel
        display: ["'Syne'", "sans-serif"],
        // Body font: clean and readable
        body: ["'DM Sans'", "sans-serif"],
        // Mono for code/data
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        // Brand palette
        brand: {
          50:  "#f0f4ff",
          100: "#e0eaff",
          200: "#c7d7fe",
          300: "#a5bcfd",
          400: "#8198fb",
          500: "#6470f3",  // primary
          600: "#5254e7",
          700: "#4341cc",
          800: "#3837a4",
          900: "#313482",
          950: "#1e1f4f",
        },
        // Accent: amber for highlights/CTAs
        accent: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        // Surface colors (light mode)
        surface: {
          0:   "#ffffff",
          50:  "#f8f9fc",
          100: "#f1f3f8",
          200: "#e4e7ef",
          300: "#d1d5e0",
        },
        // Dark surface colors
        dark: {
          900: "#0d0f17",
          800: "#12141f",
          700: "#181b28",
          600: "#1f2335",
          500: "#252942",
          400: "#2e3350",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        "glow-brand": "0 0 30px rgba(100, 112, 243, 0.25)",
        "glow-accent": "0 0 30px rgba(251, 191, 36, 0.25)",
        "card-light": "0 4px 24px rgba(0,0,0,0.07)",
        "card-dark":  "0 4px 24px rgba(0,0,0,0.4)",
      },
      animation: {
        "fade-in":    "fadeIn 0.4s ease forwards",
        "slide-up":   "slideUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "shimmer":    "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(24px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        shimmer: { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
      },
      transitionDuration: {
        250: "250ms",
        350: "350ms",
      },
    },
  },
  plugins: [],
};
