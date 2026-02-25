import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        haifa: {
          blue: '#1e3a5f',
          lightblue: '#4a90d9',
          gold: '#d4a843',
          green: '#2d8a4e',
          red: '#c0392b',
          orange: '#e67e22',
          gray: '#7f8c8d',
        },
      },
      fontFamily: {
        hebrew: ['Heebo', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
