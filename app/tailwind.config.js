module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        piss: "#f00",
      },
      keyframes: {
        rainbow: {
          "0%": {
            "background-color": "#f87171",
          },
          "18%": {
            "background-color": "#facc15",
          },
          "24%": {
            "background-color": "#a3e635",
          },
          "30%": {
            "background-color": "#4ade80",
          },
          "48%": {
            "background-color": "#22d3ee",
          },
          "66%": { "background-color": "#818cf8" },
          "78%": { "background-color": "#c084fc" },

          "90%": { "background-color": "#f472b68" },
          "100%": {
            "background-color": "#f87171",
          },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
      animation: {
        rainbow: "rainbow 2s infinite linear",
        wiggle: "wiggle 1s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}
