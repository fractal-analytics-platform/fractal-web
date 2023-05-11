import { FRACTAL_SERVER_HOST } from '$env/static/private'

export async function handle({ event, resolve }) {

	if (event.url.pathname == '/' || event.url.pathname.startsWith('/auth')) {
		return await resolve(event)
	}

	// Authentication guard
	if (event.cookies) {
		// const token = cookie
		const whoami = await event.fetch(`${FRACTAL_SERVER_HOST}/auth/whoami`)
		if (whoami.ok) {
			return await resolve(event)
		} else {
			return new Response(null, { status: 302, headers: { location: '/auth/login' } })
		}
	} else {
		return new Response(null, { status: 302, headers: { location: '/auth/login' } })
	}
}