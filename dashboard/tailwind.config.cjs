module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#F8F6FB',
        'bg-card': '#FFFFFF',
        accent: '#533A7B',
        'accent-light': 'rgba(152,193,217,0.15)',
        'powder-blue': '#98C1D9',
        'slate-blue': '#6969B3',
        'indigo-violet': '#533A7B',
        'blackberry': '#4B244A',
        'coffee-bean': '#25171A',
        compliant: '#5A8FA8',
        warning: '#6969B3',
        critical: '#533A7B',
        'text-primary': '#25171A',
        'text-secondary': '#6B6178',
        border: '#E8E4EE',
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.03)',
        'card-hover': '0 4px 24px rgba(83,58,123,0.08), 0 0 0 1px rgba(83,58,123,0.06)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
