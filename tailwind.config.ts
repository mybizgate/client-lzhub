import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

/** Brand colours resolve to CSS variables set at runtime from the client configuration. */
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: v('--c-brand'), dark: v('--c-brand-dark'), soft: v('--c-brand-soft') },
        accent: v('--c-accent'),
        hero: { from: v('--c-hero-from'), to: v('--c-hero-to') },
        ink: '#22382e',
        muted: '#6b7a70',
        page: '#f7f8f3',
        line: '#e4e9e1',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 16px 48px rgba(27,50,38,.055)',
        lift: '0 8px 25px #17352309',
      },
      borderRadius: { xl2: '1.0625rem' },
      screens: { xs: '430px' },
    },
  },
  plugins: [forms({ strategy: 'class' })],
} satisfies Config
