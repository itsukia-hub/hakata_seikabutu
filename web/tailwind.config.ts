import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1f2024',
          soft: '#3a3b40',
          mute: '#7a7b80',
        },
        paper: {
          DEFAULT: '#fafaf7',
          card: '#ffffff',
        },
        accent: {
          DEFAULT: '#6b7a8f',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Hiragino Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
