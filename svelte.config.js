import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter()
	},
	compilerOptions: {
		// allow accessing private object properties in unit tests
		accessors: !!process.env.TEST
	}
};

export default config;
