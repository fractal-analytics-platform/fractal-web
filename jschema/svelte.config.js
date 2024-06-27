import sveltePreprocess from 'svelte-preprocess';

export default {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: sveltePreprocess(),
	compilerOptions: {
		// allow accessing private object properties in unit tests
		accessors: !!process.env.TEST
	}
};
