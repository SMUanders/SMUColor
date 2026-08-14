import { defineConfig } from 'vitest/config'

// Adskilt fra vite.config.ts — enhedstests dækker ren domænelogik (søgning,
// farve-udledning, id'er) og har ikke brug for React/Tailwind-plugins.
// Denne fil typecheckes ikke af tsc (ikke i tsconfig-includes); Vitest læser
// den direkte via esbuild.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
