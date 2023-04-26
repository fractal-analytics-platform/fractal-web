import { userAuthentication } from '$lib/server/api/v1/auth_api'

export const actions = {
  // Default page action / Handles POST requests
  default: async ({ request, cookies }) => {
    // TODO: Handle login request
    console.log('Login action')

    // Get form data
    const formData = await request.formData()
    const authData = await userAuthentication(formData)

    cookies.set('fastapiusersauth', authData.access_token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
      secure: true,
      httpOnly: true
    })
  }
}