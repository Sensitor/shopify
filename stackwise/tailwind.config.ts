import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#070A14',
        panel: '#0F1424',
        panel2: '#161D33',
        border: '#222B45',
        text: '#EAEEF8',
        muted: '#8693B0',
        faint: '#5A6685',
        accent: '#7C6BFF',
        success: '#22D67B',
        danger: '#FF5470',
        warning: '#FFB020',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
