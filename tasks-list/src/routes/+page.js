import { env } from '$env/dynamic/private';

export async function load() {
	const showOnlyCoreFiltering = env.FRACTAL_DISPLAY_CORE_TASK_FILTER;
	return {
		showOnlyCoreFiltering
	};
}
