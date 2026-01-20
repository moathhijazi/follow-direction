/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./providers/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./content/**/*.{js,jsx,ts,tsx}",
    "./admin/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        reg: ["Regular"],
        light: ["Light"],
        "extra-light": ["ExtraLight"],
        med: ["Med"],
        bold: ["Bold"],
        "semi-bold": ["SemiBold"],
      },
      colors: {
        primary: "#2563eb",
      },
    },
  },
  plugins: [],
};
