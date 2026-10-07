import { sveltePreprocess } from 'svelte-preprocess';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';

/** @type {import('vite').UserConfigExport} */ const config = defineConfig({
	plugins: [
		svelte(),
		svelteTesting(),
		sveltekit({
			// Consult https://github.com/sveltejs/svelte-preprocess
			// for more information about preprocessors
			preprocess: sveltePreprocess()
		})
	],
	build: {
		outDir: './build',
		emptyOutDir: true,
		lib: {
			name: '#fractal-components',
			entry: './src/lib/index.js'
		}
	},
	test: {
		environment: 'jsdom',
		clearMocks: true,
		include: ['**/__tests__/**/*\\.test\\.js'],
		setupFiles: ['vitest.setup.js']
	}
});

export default config;
