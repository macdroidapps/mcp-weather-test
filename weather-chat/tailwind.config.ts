import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['JetBrains Mono', 'SF Mono', 'monospace'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Кастомная палитра в стиле терминала
        terminal: {
          bg: '#0a0e14',
          surface: '#12171e',
          border: '#1f2937',
          text: '#e6e6e6',
          muted: '#6b7280',
          accent: '#00d9ff',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'typing': 'typing 1s steps(3) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%, 100%': { content: "''" },
          '33%': { content: "'.'" },
          '66%': { content: "'..'" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

