import { AUTH_COOKIE_NAME } from '$app/env/private';

export async function GET({ cookies }) {
	const cookie = cookies.get(AUTH_COOKIE_NAME || 'fastapiusersauth');

	return new Response(cookie, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain'
		}
	});
}
