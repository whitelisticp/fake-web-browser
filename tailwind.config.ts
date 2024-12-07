/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
	  './pages/**/*.{ts,tsx}',
	  './components/**/*.{ts,tsx}',
	  './app/**/*.{ts,tsx}',
	  './src/**/*.{ts,tsx}',
	],
	theme: {
	  extend: {
		animation: {
		  fadeIn: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
		  fadeOut: 'fadeOut 2s ease-in-out forwards',
		  scaleUp: 'scaleUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
		  slideIn: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
		  slideOut: 'slideOut 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
		  scaleIn: 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
		  scaleOut: 'scaleOut 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
		  dialogSlideIn: 'dialogSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
		  dialogSlideOut: 'dialogSlideOut 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
		  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
		},
		keyframes: {
		  fadeIn: {
			'0%': { opacity: '0', transform: 'translateY(10px)' },
			'100%': { opacity: '1', transform: 'translateY(0)' },
		  },
		  fadeOut: {
			'0%': { opacity: '1' },
			'90%': { opacity: '1' },
			'100%': { opacity: '0', visibility: 'hidden' }
		  },
		  scaleUp: {
			'0%': { transform: 'scale(0.8)', opacity: '0' },
			'100%': { transform: 'scale(1)', opacity: '1' }
		  },
		  slideIn: {
			'0%': { transform: 'translateX(-20px)', opacity: '0' },
			'100%': { transform: 'translateX(0)', opacity: '1' }
		  },
		  slideOut: {
			'0%': { transform: 'translateX(0)', opacity: '1' },
			'100%': { transform: 'translateX(20px)', opacity: '0' }
		  },
		  scaleIn: {
			'0%': { transform: 'scale(0.95)', opacity: '0' },
			'100%': { transform: 'scale(1)', opacity: '1' }
		  },
		  scaleOut: {
			'0%': { transform: 'scale(1)', opacity: '1' },
			'100%': { transform: 'scale(0.95)', opacity: '0' }
		  },
		  dialogSlideIn: {
			'0%': { 
			  transform: 'translate(-50%, -48%) scale(.96)', 
			  opacity: '0' 
			},
			'100%': { 
			  transform: 'translate(-50%, -50%) scale(1)', 
			  opacity: '1' 
			}
		  },
		  dialogSlideOut: {
			'0%': { 
			  transform: 'translate(-50%, -50%) scale(1)', 
			  opacity: '1' 
			},
			'100%': { 
			  transform: 'translate(-50%, -48%) scale(.96)', 
			  opacity: '0' 
			}
		  },
		  pulse: {
			'0%, 100%': { opacity: '1' },
			'50%': { opacity: '0.5' }
		  },
		},
	  },
	},
	plugins: [require("tailwindcss-animate")],
  }
