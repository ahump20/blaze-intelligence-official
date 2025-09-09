// Blaze Intelligence Design System
// Tailwind CSS Configuration with Brand Identity

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        'burnt-orange': {
          DEFAULT: '#BF5700',
          50: '#FFE5D6',
          100: '#FFC9A8',
          200: '#FFAA7A',
          300: '#FF8B4C',
          400: '#ED6B1E',
          500: '#BF5700', // Primary
          600: '#9C4500',
          700: '#793600',
          800: '#562700',
          900: '#331700'
        },
        'cardinal-blue': {
          DEFAULT: '#9BCBEB',
          50: '#F5FAFD',
          100: '#E6F3FA',
          200: '#D0E8F6',
          300: '#BADDF2',
          400: '#A5D3EE',
          500: '#9BCBEB', // Primary
          600: '#6BB5E0',
          700: '#3B9FD5',
          800: '#2B7CAB',
          900: '#1F5A7D'
        },
        // Secondary Brand Colors
        'oiler-navy': {
          DEFAULT: '#002244',
          50: '#E6ECF1',
          100: '#CCDAE3',
          200: '#99B5C7',
          300: '#6690AB',
          400: '#336B8F',
          500: '#002244', // Primary
          600: '#001B36',
          700: '#001428',
          800: '#000E1A',
          900: '#00070C'
        },
        'grizzly-teal': {
          DEFAULT: '#00B2A9',
          50: '#E6F7F6',
          100: '#CCEFED',
          200: '#99DFDB',
          300: '#66CFC9',
          400: '#33C0B8',
          500: '#00B2A9', // Primary
          600: '#008E87',
          700: '#006A65',
          800: '#004643',
          900: '#002321'
        },
        // Supporting Colors
        'platinum': '#E5E4E2',
        'graphite': '#36454F',
        'pearl': '#FAFAFA',
        // System Colors
        'blaze-success': '#00C853',
        'blaze-warning': '#FFB300',
        'blaze-error': '#FF3D00',
        'blaze-info': '#00B0FF'
      },
      fontFamily: {
        'display': ['Neue Haas Grotesk Display', 'system-ui', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Custom font sizes for brand consistency
        'display-xl': ['72px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['60px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['48px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['36px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-xs': ['30px', { lineHeight: '1.3', letterSpacing: '0' }],
      },
      spacing: {
        // 8px base unit system
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        'blaze': '4px', // Standard corner radius
        'blaze-lg': '8px',
        'blaze-xl': '12px',
      },
      boxShadow: {
        'blaze-sm': '0 1px 3px rgba(0, 34, 68, 0.12)',
        'blaze': '0 4px 6px rgba(0, 34, 68, 0.1)',
        'blaze-md': '0 10px 15px rgba(0, 34, 68, 0.1)',
        'blaze-lg': '0 20px 25px rgba(0, 34, 68, 0.1)',
        'blaze-xl': '0 25px 50px rgba(0, 34, 68, 0.12)',
        'blaze-glow': '0 0 40px rgba(191, 87, 0, 0.3)',
        'blaze-inner': 'inset 0 2px 4px rgba(0, 34, 68, 0.06)',
      },
      backgroundImage: {
        // Gradient overlays for data visualization
        'blaze-gradient': 'linear-gradient(135deg, #BF5700 0%, #9BCBEB 100%)',
        'blaze-gradient-dark': 'linear-gradient(135deg, #002244 0%, #00B2A9 100%)',
        'blaze-gradient-subtle': 'linear-gradient(180deg, rgba(191, 87, 0, 0.05) 0%, rgba(155, 203, 235, 0.05) 100%)',
        'blaze-mesh': 'radial-gradient(at 40% 20%, #BF5700 0px, transparent 50%), radial-gradient(at 80% 0%, #9BCBEB 0px, transparent 50%), radial-gradient(at 0% 50%, #00B2A9 0px, transparent 50%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
        'data-pulse': 'dataPulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        dataPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(191, 87, 0, 0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(191, 87, 0, 0.8), 0 0 60px rgba(191, 87, 0, 0.4)' },
        },
      },
      transitionTimingFunction: {
        'blaze': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'blaze-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'blaze-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    // Custom plugin for Blaze-specific utilities
    function({ addUtilities, addComponents, theme }) {
      const newUtilities = {
        '.text-gradient': {
          'background-image': 'linear-gradient(135deg, #BF5700 0%, #9BCBEB 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.glass': {
          'background': 'rgba(54, 69, 79, 0.3)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(191, 87, 0, 0.2)',
        },
        '.glass-dark': {
          'background': 'rgba(0, 34, 68, 0.5)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(155, 203, 235, 0.2)',
        },
        '.data-grid': {
          'background-image': 'linear-gradient(rgba(191, 87, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(191, 87, 0, 0.1) 1px, transparent 1px)',
          'background-size': '20px 20px',
        },
      };

      const newComponents = {
        '.btn-blaze': {
          '@apply px-6 py-3 bg-burnt-orange text-pearl font-medium rounded-blaze transition-all duration-200 hover:bg-burnt-orange-600 hover:shadow-blaze-lg active:scale-95': {},
        },
        '.btn-blaze-secondary': {
          '@apply px-6 py-3 bg-graphite text-pearl font-medium rounded-blaze transition-all duration-200 hover:bg-oiler-navy hover:shadow-blaze-lg active:scale-95': {},
        },
        '.btn-blaze-outline': {
          '@apply px-6 py-3 border-2 border-burnt-orange text-burnt-orange font-medium rounded-blaze transition-all duration-200 hover:bg-burnt-orange hover:text-pearl active:scale-95': {},
        },
        '.card-blaze': {
          '@apply bg-graphite/30 backdrop-blur-sm rounded-blaze-lg border border-burnt-orange/20 p-6 transition-all duration-200 hover:shadow-blaze-xl hover:border-burnt-orange/40': {},
        },
        '.input-blaze': {
          '@apply bg-graphite/50 border border-pearl/20 rounded-blaze px-4 py-2 text-pearl placeholder-pearl/40 focus:outline-none focus:border-burnt-orange focus:ring-2 focus:ring-burnt-orange/20 transition-all duration-200': {},
        },
        '.badge-blaze': {
          '@apply inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-burnt-orange/10 text-burnt-orange border border-burnt-orange/20': {},
        },
      };

      addUtilities(newUtilities);
      addComponents(newComponents);
    },
  ],
};
