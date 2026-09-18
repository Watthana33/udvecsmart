/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vec: {
          primary: '#932d16',
          primaryDark: '#742210',
          primaryLight: '#b2391e',
          primaryBg: '#fdf6f4',
          blue: '#1e3a8a',
          navy: '#0f172a',
          gold: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Sarabun', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
