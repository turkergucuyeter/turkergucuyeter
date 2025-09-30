import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        supervisor: '#2563EB'
      }
    }
  },
  plugins: []
} satisfies Config;
