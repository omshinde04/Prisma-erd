export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050816',
          900: '#0b1120',
          850: '#11192d',
          800: '#152033',
          700: '#1c2a42',
        },
        accent: {
          cyan: '#67e8f9',
          blue: '#60a5fa',
          emerald: '#34d399',
          violet: '#8b5cf6',
          amber: '#fbbf24',
          rose: '#fb7185',
        },
      },
      boxShadow: {
        panel: '0 24px 80px rgba(2, 6, 23, 0.34)',
        soft: '0 18px 50px rgba(2, 6, 23, 0.24)',
      },
      backgroundImage: {
        'erd-grid': 'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.12) 1px, transparent 0)',
      },
    },
  },
  plugins: [],
};
