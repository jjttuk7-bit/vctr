/** @type {import('tailwindcss').Config} */
// Synced with BRANDING.md and config.yaml brand_colors
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand core
        'vctr-indigo':       '#6366F1',
        'vctr-indigo-light': '#818CF8',
        'vctr-indigo-dark':  '#4338CA',
        'vctr-black':        '#0A0A0F',
        'vctr-black-2':      '#1C1C28',
        'vctr-surface':      '#F8FAFC',
        'vctr-cyan':         '#22D3EE',
        // Category
        'cat-aiwriting':     '#6366F1',
        'cat-aiimage':       '#EC4899',
        'cat-productivity':  '#10B981',
        'cat-devtools':      '#F59E0B',
        'cat-nocode':        '#3B82F6',
        'cat-marketing':     '#EF4444',
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
