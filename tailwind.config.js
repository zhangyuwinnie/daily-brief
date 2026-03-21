/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f7fcea",
          100: "#edf8d1",
          200: "#dcefaa",
          300: "#c5f87b",
          400: "#a2ea5c",
          500: "#94e354",
          600: "#7bc932",
          700: "#5c962c"
        }
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.05)",
        soft: "0 4px 20px rgba(0,0,0,0.03)",
        float: "0 20px 60px rgba(0,0,0,0.08)"
      },
      borderRadius: {
        shell: "2.5rem",
        card: "2rem"
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
