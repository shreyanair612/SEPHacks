module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-app': '#4B244A',
        'bg-deep': '#25171A',
        'surface-dark': '#533A7B',
        'accent-primary': '#98C1D9',
        'accent-secondary': '#6969B3',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'sans-serif'],
      },
      borderRadius: {
        card: '6px',
        button: '4px',
        sm: '2px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
  plugins: [],
}
