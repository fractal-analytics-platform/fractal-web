import { PUBLIC_FRACTAL_SERVER_HOST } from '$env/static/public'

export async function userAuthentication(data) {

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + '/auth/login', {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    body: data
  })

  if (!response.ok) {
    throw new Error('Authentication failed')
  }

  const userInfo = await whoami().catch((error) => {
    console.error(error)
  })

  return userInfo
}

export async function whoami() {

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + '/auth/whoami', {
    method: 'GET',
    credentials: 'include',
    mode: 'cors'
  })

  if (response.ok) {
    return await response.json()
  }

  throw new Error('Unable to fetch user identity')
}