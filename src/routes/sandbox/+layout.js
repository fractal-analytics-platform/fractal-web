import { redirect } from '@sveltejs/kit';

export async function load() {
	if (import.meta.env.MODE !== 'development') {
		console.warn('Sandbox page is disabled in development mode');
		throw redirect(307, '/');
	}
}
