/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      colors: {
        matrix: {
          light: "rgb(0, 255, 170)",
          DEFAULT: "rgb(0, 230, 100)",
          dark: "rgb(0, 180, 70)",
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { filter: "brightness(100%)" },
          "50%": { filter: "brightness(150%)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "glow-blue": "0 0 8px rgba(59, 130, 246, 0.8)",
        "glow-indigo": "0 0 8px rgba(99, 102, 241, 0.8)",
        "glow-green": "0 0 8px rgba(16, 185, 129, 0.8)",
        "glow-matrix": "0 0 12px rgba(0, 230, 100, 0.8)",
      },
    },
  },
  plugins: [],
};
