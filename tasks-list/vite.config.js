import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		sveltekit()
	],
	resolve: {
		alias: {
			'fractal-components': fileURLToPath(new URL('../components/src/lib/index.js', import.meta.url))
		}
	},
	optimizeDeps: {
		// The dependencies to be optimized are explicitly listed, to avoid the reloads triggered by their automatic detection
		include: ['semver', 'slim-select', 'dompurify', 'marked']
	}
});
