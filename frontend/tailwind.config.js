/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: { 50: '#effaf6', 100: '#d6f2e6', 500: '#1fae83', 600: '#158f6a', 700: '#117256' },
        ink: { 800: '#16231f', 900: '#0f1a17' },
        paper: '#f5f7f4',
        star: '#f2a900',
      },
    },
  },
  plugins: [],
};
