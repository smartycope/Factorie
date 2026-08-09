import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/factorie/',
  assetsInclude: ["**/*.xlsx"],
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
})
