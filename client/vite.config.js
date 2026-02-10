import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// Strip @layer wrappers and @property declarations from CSS so it works
// on older Samsung Tizen WebViews (Chromium 76) that don't support them.
// Tailwind v4 outputs layers in correct source order, so unwrapping is safe.
function unwrapCSSLayers() {
  return {
    name: 'unwrap-css-layers',
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'asset' || !file.fileName.endsWith('.css')) continue;

        let css = typeof file.source === 'string' ? file.source : file.source.toString();

        // Remove @property declarations (Tailwind has @supports fallbacks for these)
        css = css.replace(/@property\s+[^{]+\{[^}]*\}/g, '');

        // Remove bare @layer declarations (e.g. @layer components;)
        css = css.replace(/@layer\s+[\w-]+\s*;/g, '');

        // Unwrap @layer blocks by matching balanced braces
        let result = '';
        let i = 0;
        while (i < css.length) {
          const layerMatch = css.slice(i).match(/^@layer\s+[\w-]+\s*\{/);
          if (layerMatch) {
            i += layerMatch[0].length;
            let depth = 1;
            let start = i;
            while (i < css.length && depth > 0) {
              if (css[i] === '{') depth++;
              else if (css[i] === '}') depth--;
              if (depth > 0) i++;
            }
            result += css.slice(start, i);
            i++; // skip closing brace
          } else {
            result += css[i];
            i++;
          }
        }

        // Replace inset: with top/right/bottom/left for Chrome <87
        result = result.replace(/inset:([^;}]+)/g, (_, val) => {
          const v = val.trim();
          return `top:${v};right:${v};bottom:${v};left:${v}`;
        });

        file.source = result;
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), unwrapCSSLayers()],
  build: {
    rollupOptions: {
      input: {
        tv: resolve(__dirname, 'tv.html'),
        phone: resolve(__dirname, 'phone.html'),
      },
    },
    outDir: 'dist',
    target: 'chrome63',
  },
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
});
