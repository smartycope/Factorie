import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/factorie/',
  assetsInclude: ["**/*.xlsx"],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['test/**/*.test.js'],
        },
      },
      {
        extends: true,
        test: {
          name: 'pages',
          environment: 'jsdom',
          include: ['test/**/*.test.jsx'],
        },
      },
    ],
  },
})
