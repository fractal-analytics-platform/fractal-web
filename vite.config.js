import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	test: {
		globals: true,
		include: ['**/__tests__/**/*.?(c|m)[jt]s?(x)']
	}
};

export default config;
