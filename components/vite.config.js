import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';

/** @type {import('vite').UserConfigExport} */
const config = defineConfig({
	plugins: [svelte(), svelteTesting()],
	build: {
		outDir: './build',
		emptyOutDir: true,
		lib: {
			name: 'fractal-components',
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
