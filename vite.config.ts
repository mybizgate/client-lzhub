import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { resolveClient } from './src/config/clients'

/**
 * Fills the %CLIENT_*% placeholders in index.html from the active client's configuration,
 * so the static HTML shell (title, description, Open Graph, favicon) is never hand-edited per client.
 */
function clientHtml(clientCode: string, siteUrl: string): Plugin {
  const c = resolveClient(clientCode)
  const values: Record<string, string> = {
    CLIENT_LANG: c.locale.split('-')[0] ?? 'ms',
    CLIENT_NAME: c.businessName,
    CLIENT_TITLE: c.seo.title,
    CLIENT_DESCRIPTION: c.seo.description,
    CLIENT_OG_IMAGE: siteUrl + (c.seo.ogImage ?? c.logo),
    CLIENT_OG_LOCALE: c.locale.replace('-', '_'),
    CLIENT_URL: siteUrl,
    CLIENT_FAVICON: c.favicon,
    CLIENT_THEME_COLOR: c.branding.primaryColor ?? '#176f51',
  }
  const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  return {
    name: 'mybizgate-client-html',
    transformIndexHtml(html) {
      return html.replace(/%CLIENT_([A-Z_]+)%/g, (_, key: string) => escapeAttr(values[`CLIENT_${key}`] ?? ''))
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const clientCode = env.VITE_CLIENT_CODE || 'lzhub'
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '')
  return {
    plugins: [vue(), clientHtml(clientCode, siteUrl)],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: { vendor: ['vue', 'vue-router', 'pinia'] },
        },
      },
    },
    server: { port: 5173 },
  }
})
