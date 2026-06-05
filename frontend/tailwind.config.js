/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Her Pink
        pink: {
          50: '#fff5f7',
          100: '#ffe0e6',
          200: '#ffc8dc',
          300: '#ffb3cc',
          400: '#ff99b9',
          500: '#ff99b9', // Primary pink
          600: '#ff69b4', // Darker pink
          700: '#d91e63',
          800: '#ad1457',
        },
        // His Earthy
        earthy: {
          50: '#fdf8f3',
          100: '#f5deb3',
          200: '#ede0d0',
          300: '#e0c5aa',
          400: '#d2b48c', // Primary earthy
          500: '#c9a083',
          600: '#8b7355', // Darker earthy
          700: '#704a1f',
          800: '#5a3a15',
        },
        // Accents
        teal: {
          100: '#b0e8e8',
          400: '#7dbfc9',
          500: '#5ab3bb',
        },
        purple: {
          100: '#e8d4f0',
          200: '#d4a5d9',
          300: '#c896d0',
        },
        gold: {
          100: '#ffecb3',
          200: '#ffe082',
          400: '#ffd700',
        },
        cream: '#fff9f5',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
        ],
      },
      spacing: {
        '0.5': '0.125rem',
        '1.5': '0.375rem',
        '2.5': '0.625rem',
        '3.5': '0.875rem',
      },
      borderRadius: {
        'xs': '0.25rem',
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'pink-md': '0 4px 6px -1px rgba(255, 153, 185, 0.2)',
        'earthy-md': '0 4px 6px -1px rgba(210, 180, 140, 0.2)',
      },
    },
  },
  plugins: [],
  // v4 new features
  corePlugins: {
    // Keep all plugins enabled
  },
}
