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
		},
		keyframes: {
		  fadeIn: {
			'0%': { opacity: '0', transform: 'translateY(10px)' },
			'100%': { opacity: '1', transform: 'translateY(0)' },
		  },
		},
	  },
	},
	plugins: [require("tailwindcss-animate")],
  }