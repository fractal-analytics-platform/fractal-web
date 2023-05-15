import { fail, redirect } from '@sveltejs/kit'
import * as jose from 'jose'
import { userAuthentication } from '$lib/server/api/v1/auth_api'
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_DOMAIN,
  AUTH_COOKIE_PATH,
  AUTH_COOKIE_SAME_SITE,
  AUTH_COOKIE_SECURE,
  AUTH_COOKIE_HTTP_ONLY
} from '$env/static/private'

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
    const cookieOptions = {
      domain: `${AUTH_COOKIE_DOMAIN}`,
      path: `${AUTH_COOKIE_PATH}`,
      expires: new Date(tokenClaims.exp * 1000),
      sameSite: `${AUTH_COOKIE_SAME_SITE}`,
      secure: `${AUTH_COOKIE_SECURE}` === 'true',
      httpOnly: `${AUTH_COOKIE_HTTP_ONLY}` === 'true'
    }
    console.log(cookieOptions)
    cookies.set(AUTH_COOKIE_NAME, authData.access_token, cookieOptions)

    throw redirect(302, '/')
  }
}