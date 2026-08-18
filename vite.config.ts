import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Bind til den port harness'en tildeler via PORT-env (autoPort), ellers Vites
// standard. Ingen strictPort → falder tilbage til næste ledige port hvis optaget.
const envPort = Number(
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.PORT,
)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: envPort ? { port: envPort } : undefined,
})
