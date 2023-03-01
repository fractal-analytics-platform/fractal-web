import { PUBLIC_FRACTAL_SERVER_HOST } from '$env/static/public'

export async function load({ cookies, fetch }) {
  const accessToken = cookies.get('AccessToken')

  if (accessToken !== undefined) {
    const userData = await fetch(PUBLIC_FRACTAL_SERVER_HOST + '/auth/whoami', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken
      },
    })
      .then(response => {
        if (response.status == 200) {
          return response.json()
        }
      })

    return { userData }
  }
}

export const actions = {
  default: async ({ request, fetch, cookies }) => {

    let requestUrl = PUBLIC_FRACTAL_SERVER_HOST + '/auth/token/login'

    const requestForm = await request.formData()

    const loginResponse = await fetch(requestUrl, {
      method: 'POST',
      credentials: 'include',
      body: requestForm
    })

    let status = loginResponse.status

    if (status !== 200) {
      return { loginSuccess: false }
    }

    await loginResponse
      .json()
      .then((data) => {
        cookies.set('AccessToken', 'Bearer ' + data['access_token'], {
          path: '/',
          secure: true,
          httpOnly: true,
          maxAge: 86400
        })
      })

    return { loginSuccess: true }
  }
}