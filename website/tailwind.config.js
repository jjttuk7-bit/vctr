/** @type {import('tailwindcss').Config} */
// 참조: BRANDING.md 4절
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 브랜드 코어
        'know-red':        '#C0392B',
        'know-red-light':  '#E8534A',
        'know-red-dark':   '#922B21',
        'know-navy':       '#1A1A2E',
        'know-navy-light': '#2C2C4A',
        'know-white':      '#FAF9F6',
        'know-gold':       '#E8B86D',
        // 카테고리
        'cat-beauty':      '#D4537E',
        'cat-drama':       '#7F77DD',
        'cat-pop':         '#D85A30',
        'cat-food':        '#BA7517',
        'cat-fashion':     '#444441',
        'cat-lifestyle':   '#1D9E75',
        'cat-travel':      '#378ADD',
        'cat-sport':       '#639922',
        'cat-ent':         '#E24B4A',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
