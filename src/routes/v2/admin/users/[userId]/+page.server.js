import { getUser } from '$lib/server/api/v1/auth_api';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, params }) {
	console.log(`Loading user ${params.userId}`);

	/** @type {import('$lib/types').User} */
	const user = await getUser(fetch, params.userId);

	return {
		user
	};
}
