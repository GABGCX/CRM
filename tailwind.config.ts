import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        sidebar: {
          DEFAULT: '#0f172a',
          hover:   '#1e293b',
          active:  '#1e293b',
        },
        surface: {
          0: '#ffffff',
          1: '#f8fafc',
          2: '#f1f5f9',
        },
        border: {
          DEFAULT: '#e2e8f0',
          subtle:  '#f1f5f9',
        },
        ink: {
          DEFAULT: '#0f172a',
          2:       '#475569',
          3:       '#64748b',
          4:       '#94a3b8',
        },
        brand: {
          DEFAULT: '#4f46e5',
          dark:    '#4338ca',
          light:   '#eef2ff',
          border:  '#c7d2fe',
        },
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        modal: '0 20px 60px rgba(0,0,0,.15), 0 8px 24px rgba(0,0,0,.08)',
        sm:    '0 1px 2px rgba(0,0,0,.05)',
        md:    '0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04)',
      },
      borderRadius: {
        card:  '10px',
        modal: '12px',
      },
    },
  },
  plugins: [],
} satisfies Config
