import { listUsers } from '$lib/server/api/auth_api.js';

export async function load({ fetch }) {

  const users = await listUsers(fetch);

	return {
		users
	};
}
