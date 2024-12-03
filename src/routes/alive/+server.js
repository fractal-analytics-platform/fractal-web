import { getServerInfo } from '$lib/server/api/alive';

export async function GET({ fetch }) {
	// @ts-ignore
	// eslint-disable-next-line no-undef
	const version = __APP_VERSION__;

	// Retrieve server info (alive and version)
	const serverInfo = await getServerInfo(fetch);

	return new Response(
		JSON.stringify({
			alive: true,
			version,
			fractal_server_alive: serverInfo.alive,
			fractal_server_version: serverInfo.version
		}),
		{
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
}
