/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'github-dark': '#0d1117',
        'github-darker': '#010409',
        'github-border': '#30363d',
        'github-accent': '#58a6ff',
      },
    },
  },
  plugins: [],
}
