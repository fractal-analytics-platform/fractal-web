import { redirect } from '@sveltejs/kit';

export async function load() {
	if (import.meta.env.MODE !== 'development') {
		throw redirect(307, '/');
	}
}