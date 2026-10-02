/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', './content/interactives/**/*.tsx'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: { extend: {} },
  plugins: [],
}
