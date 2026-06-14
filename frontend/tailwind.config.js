export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#fef9f3',
        earthy: {
          50: '#faf8f5',
          100: '#f5f1ed',
          200: '#e8dfd5',
          300: '#d9cbb9',
          400: '#c4ab8f',
          500: '#b08968',
          600: '#9a7456',
          700: '#78716c',
          800: '#57534e',
          900: '#44403c',
        },
        pink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
      },
      boxShadow: {
        'pink-md': '0 4px 14px 0 rgba(236, 72, 153, 0.15)',
        'pink-lg': '0 10px 40px 0 rgba(236, 72, 153, 0.2)',
      },
      animation: {
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'slide-in-up': 'slideInUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.1)' },
          '50%': { transform: 'scale(1)' },
        },
        slideInUp: {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInRight: {
          from: {
            opacity: '0',
            transform: 'translateX(-20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
      },
    },
  },
  plugins: [],
}
