import { redirect } from '@sveltejs/kit'
import { userAuthentication } from '$lib/server/api/v1/auth_api'

export const actions = {
  // Default page action / Handles POST requests
  default: async ({ request, cookies, fetch }) => {
    // TODO: Handle login request
    console.log('Login action')

    // Get form data
    const formData = await request.formData()
    const authData = await userAuthentication(fetch, formData)

    cookies.set('fastapiusersauth', authData.access_token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
      secure: true,
      httpOnly: true
    })

    throw redirect(302, '/')
  }
}