import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { platformUpdate } from './src/platform-update/vitePlatformUpdate'

// https://vitejs.dev/config/
// Menneskelig PRODUKTVERSION — eneste sandhedskilde er package.json "version".
// Indlejres som __APP_PRODUCT_VERSION__ og vises diskret i UI. Adskilt fra et
// teknisk build-id, som denne app ikke har (se src/lib/version.ts).
const PRODUCT_VERSION = JSON.parse(readFileSync('./package.json', 'utf-8')).version as string

export default defineConfig({
  define: {
    __APP_PRODUCT_VERSION__: JSON.stringify(PRODUCT_VERSION),
  },
  plugins: [react(), tailwindcss(), platformUpdate()],
  // Fast port pr. app (porttabel i SMU_APP_STANDARD.md). strictPort: optaget port = fejl, ikke en anden port.
  server: { port: 5186, strictPort: true },
})
