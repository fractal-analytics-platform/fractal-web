import { env } from '$env/dynamic/private';

export async function GET({ cookies }) {
	const cookie = cookies.get(env.AUTH_COOKIE_NAME || 'fastapiusersauth');

	return new Response(JSON.stringify({ token: cookie }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
