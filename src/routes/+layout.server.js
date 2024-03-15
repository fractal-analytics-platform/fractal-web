import { FRACTAL_SERVER_HOST } from '$env/static/private';
import { getCurrentUser } from '$lib/server/api/v1/auth_api';

export async function load({ fetch, cookies, request }) {
	// This is a mark to notify and log when the server is running SSR
	console.log('SSR - Main layout');

	const serverInfo = await fetch(FRACTAL_SERVER_HOST + '/api/alive/')
		.then(async (res) => {
			const info = await res.json();
			console.log(`Server info loaded: Alive ${info.alive} - ${info.version}`);
			return info;
		})
		.catch((error) => {
			console.log('Error loading server info');
			console.error(error);
		});

	const apiVersion = request.url.includes('/v1/') ? 'v1' : 'v2';

	// Check user info
	// Check auth cookie is present
	const fastApiUsersAuth = cookies.get('fastapiusersauth');
	if (!fastApiUsersAuth) {
		console.log('No auth cookie found');
		return {
			serverInfo,
			userInfo: null,
			apiVersion
		};
	}

	const userInfo = await getCurrentUser(fetch).catch((error) => {
		console.log('Error loading user info');
		console.error(error);
		return null;
	});

	return {
		serverInfo,
		userInfo,
		apiVersion
	};
}
