import adapter from '@sveltejs/adapter-static';
import { sveltePreprocess } from 'svelte-preprocess';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		sveltekit({
			// Consult https://github.com/sveltejs/svelte-preprocess
			// for more information about preprocessors
			preprocess: sveltePreprocess(),

			// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
			// If your environment is not supported or you settled on a specific environment, switch out the adapter.
			// See https://kit.svelte.dev/docs/adapters for more information about adapters.
			adapter: adapter({ fallback: 'index.html' }),
			paths: { base: '/templates-table' },
			alias: { '#fractal-components': '../components/src/lib' }
		})
	],
	resolve: {
		alias: {
			'#fractal-components': fileURLToPath(
				new URL('../components/src/lib/index.js', import.meta.url)
			)
		}
	},
	optimizeDeps: {
		// The dependencies to be optimized are explicitly listed, to avoid the reloads triggered by their automatic detection
		include: ['slim-select', 'bootstrap', 'bootstrap-icons']
	}
});
