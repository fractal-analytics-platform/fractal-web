import { listUsers } from '$lib/server/api/v1/auth_api';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	console.log('Load users page');

	// Load users from server
	const users = await listUsers(fetch);

	return {
		users
	};
}
