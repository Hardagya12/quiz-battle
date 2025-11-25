/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neo: {
          bg: '#FDF6E3', // Off-white/Beige
          black: '#000000',
          white: '#FFFFFF',
          primary: '#FF6B6B', // Red/Pink
          secondary: '#4ECDC4', // Teal
          accent: '#FFE66D', // Yellow
          green: '#95E1D3',
          purple: '#A8D8EA',
        },
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px #000000',
        'neo-sm': '2px 2px 0px 0px #000000',
        'neo-lg': '8px 8px 0px 0px #000000',
        'neo-xl': '12px 12px 0px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
      },
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'cursive'],
        'mono': ['"Space Mono"', 'monospace'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        }
      }
    },
  },
  plugins: [],
}

