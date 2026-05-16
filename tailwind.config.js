/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        bg: '#0e0e11',
        surface: '#16161a',
        border: '#2a2a32',
        node: '#1e1e26',
        accent: '#7c6af7',
        'accent-dim': '#3d3580',
        muted: '#6b6b7e',
        success: '#3ecf8e',
        danger: '#f87171',
        warn: '#fbbf24',
      },
    },
  },
  plugins: [],
}
