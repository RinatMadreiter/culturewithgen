import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],

  theme: {
    extend: {
      colors: {
        background: "#1e3932",
        surface: "#1e3932",
        "surface-variant": "#2a4a41",
        "on-surface": "#faf9f6",
        "on-surface-variant": "#cbe9df",
        outline: "#727975",

        // 3. Accents & Actions
        primary: "#cbe9df",
        "on-primary": "#04201a",
        secondary: "#9a442d",
        "on-secondary": "#ffffff",
        error: "#ba1a1a",
      },
      fontFamily: {
        // 4. Redundancy check: Set a default sans.
        sans: ["'Manrope Variable'", "sans-serif"],
        headline: ["'Manrope Variable'", "sans-serif"],
        body: ["'Manrope Variable'", "sans-serif"],
        label: ["'Manrope Variable'", "sans-serif"],
      },
    },
  },
  plugins: [forms, containerQueries],
};
