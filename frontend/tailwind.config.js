/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'noir': {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a2e',
          600: '#2a2a3a',
          500: '#3a3a4a',
        },
        'gold': {
          DEFAULT: '#c9a84c',
          dim: '#8a7333',
        },
        'blood': {
          DEFAULT: '#8b2500',
          bright: '#cc3700',
        },
      },
      fontFamily: {
        'serif': ['"Playfair Display"', 'Georgia', 'serif'],
        'sans': ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
