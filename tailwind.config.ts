import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './popup.html',
    './wallet-create.html',
    './wallet-unlock.html',
    './send.html',
    './receive.html',
    './history.html',
    './settings.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
      },
      keyframes: {
        'scale-in': {
          'from': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'slide-down': {
          'from': {
            opacity: '0',
            transform: 'translate(-50%, -20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translate(-50%, 0)',
          },
        },
      },
    },
  },
  plugins: [],
}

export default config

