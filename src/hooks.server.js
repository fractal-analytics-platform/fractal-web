import { FRACTAL_SERVER_HOST } from '$env/static/private'

export async function handle({ event, resolve }) {
	console.log(`[${event.request.method}] - ${event.url.pathname}`)

	if (event.url.pathname == '/' || event.url.pathname.startsWith('/auth')) {
		console.log('Public page - No auth required')
		return await resolve(event)
	}

	// Authentication guard
	const fastApiUsersAuth = event.cookies.get('fastapiusersauth')
	if (!fastApiUsersAuth) {
		console.log('Authentication required - No auth cookie found - Redirecting to login')
		return new Response(null, { status: 302, headers: { location: '/auth/login' } })
	}

	const whoami = await event.fetch(`${FRACTAL_SERVER_HOST}/auth/whoami`)
	if (whoami.ok) {
		return await resolve(event)
	} else {
		console.log('Validation of authentication - Error loading user info')
		return new Response(null, { status: 302, headers: { location: '/auth/login' } })
	}
}