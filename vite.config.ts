import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const REPO_NAME = 'after-hours'

/**
 * GitHub Pages has no SPA fallback: it serves 404.html for unknown paths.
 * Shipping a copy of index.html as 404.html lets the client router handle deep links.
 */
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'gh-pages-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      await copyFile(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [react(), spaFallback()],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  css: {
    preprocessorOptions: {
      scss: { loadPaths: [resolve(import.meta.dirname, 'src')] },
    },
  },
})
