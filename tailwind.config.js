/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-tertiary-fixed": "#001f28",
        "primary-fixed": "#ffdad7",
        "primary-fixed-dim": "#ffb3ad",
        "secondary-fixed-dim": "#ffb3ad",
        "on-surface-variant": "#5a403e",
        "background": "#fcf9f8",
        "on-error-container": "#93000a",
        "outline-variant": "#e2bebb",
        "on-secondary-container": "#782d2a",
        "tertiary-container": "#006d87",
        "on-error": "#ffffff",
        "surface-container-highest": "#e5e2e1",
        "on-secondary-fixed-variant": "#7a2e2b",
        "on-primary-fixed-variant": "#910615",
        "surface-variant": "#e5e2e1",
        "tertiary-fixed": "#b7eaff",
        "on-secondary-fixed": "#3f0305",
        "secondary-fixed": "#ffdad7",
        "primary": "#990f19",
        "error": "#ba1a1a",
        "surface-container-low": "#f6f3f2",
        "tertiary": "#005368",
        "outline": "#8e706d",
        "secondary": "#984540",
        "surface-container-high": "#eae7e7",
        "on-tertiary": "#ffffff",
        "error-container": "#ffdad6",
        "on-primary-fixed": "#410004",
        "primary-container": "#bc2c2e",
        "surface-container-lowest": "#ffffff",
        "on-primary": "#ffffff",
        "inverse-on-surface": "#f3f0ef",
        "inverse-primary": "#ffb3ad",
        "on-surface": "#1b1c1c",
        "surface-dim": "#dcd9d9",
        "on-secondary": "#ffffff",
        "secondary-container": "#ff978f",
        "inverse-surface": "#303030",
        "on-tertiary-container": "#b4e9ff",
        "on-background": "#1b1c1c",
        "on-primary-container": "#ffd9d5",
        "tertiary-fixed-dim": "#83d1ee",
        "surface-container": "#f0eded",
        "surface-bright": "#fcf9f8",
        "on-tertiary-fixed-variant": "#004d61",
        "surface-tint": "#b42629",
        "surface": "#fcf9f8"
      },
      fontFamily: {
        "headline": ["Inter", "system-ui", "sans-serif"],
        "body": ["Inter", "system-ui", "sans-serif"],
        "label": ["Inter", "system-ui", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      }
    }
  },
  plugins: []
}