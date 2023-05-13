import { fail, redirect } from '@sveltejs/kit'
import * as jose from 'jose'
import { userAuthentication } from '$lib/server/api/v1/auth_api'

export const actions = {
  // Default page action / Handles POST requests
  default: async ({ request, cookies, fetch }) => {
    // TODO: Handle login request
    console.log('Login action')

    // Get form data
    const formData = await request.formData()
    // Set auth data
    let authData
    try {
      authData = await userAuthentication(fetch, formData)
    } catch (error) {
      console.error(error)
      return fail(400, { invalidMessage: 'Invalid credentials', invalid: true })
    }
    const authToken = authData.access_token
    // Decode JWT token claims
    const tokenClaims = jose.decodeJwt(authToken)

    // Set the authentication cookie
    cookies.set('fastapiusersauth', authData.access_token, {
      path: '/',
      expires: new Date(tokenClaims.exp * 1000),
      sameSite: 'lax',
      secure: true,
      httpOnly: true
    })

    throw redirect(302, '/')
  }
}