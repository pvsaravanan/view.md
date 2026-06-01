/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#D4FF7A',
          DEFAULT: '#C5FF4A',
          dark: '#B0EB20',
        },
        zk: {
          neon: '#C5FF4A',
          white: '#FFFFFF',
          offwhite: '#EBEBEB',
          graylight: '#E5E5E5',
          graymed: '#C8CDD2',
          graystd: '#C5C5C5',
          graydark: '#7A7A7A',
          charcoal: '#3D3D3D',
          black: '#000000',
          warning: '#FFA94A'
        },
        slate: {
          950: '#000000', // Override 950 to black for dark mode panels
        }
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"PT Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'Courier New', 'monospace'],
      },
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        DEFAULT: '4px',
        'md': '6px',
        'lg': '10px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
        'pill': '999px',
      },
      boxShadow: {
        'flat': 'none',
        'lift': '0px 4px 12px rgba(0, 0, 0, 0.08)',
        'modal': '0px 16px 48px rgba(0, 0, 0, 0.24)',
        'dark-lift': '0px 4px 12px rgba(0, 0, 0, 0.4)',
        'offset-neon': '4px 4px 0 #C5FF4A',
        'offset-neon-active': '2px 2px 0 #C5FF4A',
        'offset-dark': '4px 4px 0 #3D3D3D',
        'offset-dark-active': '2px 2px 0 #3D3D3D',
        'glow-neon-sm': '0 0 6px rgba(197, 255, 74, 0.35)',
        'glow-neon-md': '0 0 8px rgba(197, 255, 74, 0.4)',
        'glow-neon-lg': '0 0 40px rgba(197, 255, 74, 0.25)',
        'inset-press': 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
        'rig-card': '0 2px 0 rgba(235, 235, 235, 0.25), 0 -1px rgba(0, 0, 0, 0.5), 0 20px 60px rgba(0, 0, 0, 0.4)',
        'rig-card-light': '0 2px 0 rgba(10, 10, 10, 0.08), 0 16px 40px rgba(10, 10, 10, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.97)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
