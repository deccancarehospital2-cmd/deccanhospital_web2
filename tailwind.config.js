/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#0879a8',
          blue2: '#075b82',
          dark: '#073e59',
          red: '#c93434',
          ink: '#173042',
          muted: '#637582',
          bg: '#f5fafc',
          line: '#dce9ee',
          cardBorder: '#e1eef2',
          lightBlue: '#edf8fb',
          badgeBg: '#dff2f8',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'brand': '0 18px 50px rgba(16,65,84,.12)',
        'card': '0 10px 30px rgba(16,65,84,.07)',
        'info': '0 12px 30px rgba(16,65,84,.09)',
        'header': '0 4px 18px rgba(0,0,0,.06)',
      },
      borderRadius: {
        'card': '20px',
        'subcard': '17px',
      }
    },
  },
  plugins: [],
}
