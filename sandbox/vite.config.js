import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		sveltekit()
	],
	resolve: {
		alias: {
			'fractal-jschema': fileURLToPath(new URL('../jschema/src/lib/index.js', import.meta.url))
		}
	},
	optimizeDeps: {
		// The dependencies to be optimized are explicitly listed, to avoid the reloads triggered by their automatic detection
		include: ['ajv/dist/ajv', 'ajv/dist/2020', 'ajv-formats']
	}
});
