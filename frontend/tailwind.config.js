/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Outfit"',
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          '"Outfit"',
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        surface: {
          DEFAULT: "#121212",
          raised: "#1a1a1a",
          card: "#1e1e1e",
          border: "#2e2e2e",
        },
        accent: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
          muted: "#93C5FD",
        },
        brand: {
          DEFAULT: "#3B82F6",
          dark: "#2563EB",
          deep: "#1E40AF",
          glow: "#93C5FD",
        },
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(59, 130, 246, 0.4)",
        "glow-cyan": "0 0 32px -6px rgba(96, 165, 250, 0.35)",
        card: "0 8px 32px -8px rgba(0, 0, 0, 0.55)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(59, 130, 246, 0.22), transparent), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(96, 165, 250, 0.1), transparent)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
        softer: "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      animation: {
        "fade-in": "fadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-down": "slideDown 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scaleIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "nav-in": "navIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        shimmer: "shimmer 2s linear infinite",
        "glow-pulse": "glowPulse 4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "logo-glow": "logoGlow 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translate3d(0, 14px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translate3d(0, -10px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        navIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.35", transform: "scale(1) translate3d(0, 0, 0)" },
          "50%": { opacity: "0.6", transform: "scale(1.04) translate3d(0, -6px, 0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        logoGlow: {
          "0%, 100%": { boxShadow: "0 0 20px -4px rgba(59, 130, 246, 0.45)" },
          "50%": { boxShadow: "0 0 32px -2px rgba(59, 130, 246, 0.65)" },
        },
      },
    },
  },
  plugins: [],
};
