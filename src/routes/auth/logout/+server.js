import { error } from '@sveltejs/kit'
import { logout } from '$lib/server/api/v1/auth_api'

export async function GET({ fetch, cookies }) {

	try {
		await logout(fetch)
	} catch (e) {
		console.error(e)
		throw error(500, { message: e.message })
	}

	// Set the fastapiusersauth cookie to expire in the past
	// This will delete the cookie
	cookies.set('fastapiusersauth', '', {
		expires: new Date(0),
		path: '/'
	})

	const headers = new Headers()
	// Set a redirect header to index
	headers.set('Location', '/')

	return new Response('', { headers, status: 302 })
}