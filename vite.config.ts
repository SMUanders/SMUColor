import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

// Bind til den port harness'en tildeler via PORT-env (autoPort), ellers Vites
// standard. Ingen strictPort → falder tilbage til næste ledige port hvis optaget.
const envPort = Number(
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.PORT,
)

// https://vitejs.dev/config/
// Menneskelig PRODUKTVERSION — eneste sandhedskilde er package.json "version".
// Indlejres som __APP_PRODUCT_VERSION__ og vises diskret i UI. Adskilt fra et
// teknisk build-id, som denne app ikke har (se src/lib/version.ts).
const PRODUCT_VERSION = JSON.parse(readFileSync('./package.json', 'utf-8')).version as string

export default defineConfig({
  define: {
    __APP_PRODUCT_VERSION__: JSON.stringify(PRODUCT_VERSION),
  },
  plugins: [react(), tailwindcss()],
  server: envPort ? { port: envPort } : undefined,
})
