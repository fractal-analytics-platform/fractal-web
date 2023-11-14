import { listUsers } from '$lib/server/api/v1/auth_api';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, params }) {
	console.log(`Loading user ${params.userId}`);

	/** @type {import('$lib/types').User[]} */
	const users = await listUsers(fetch);

	const userId = parseInt(params.userId);
	const user = users.filter((u) => u.id === userId);

	if (user.length !== 1) {
		throw error(404, `There is no user associated with the user id ${userId}`);
	}

	return {
		user: user[0]
	};
}
