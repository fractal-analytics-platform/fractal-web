import { FRACTAL_SERVER_HOST } from '$env/static/private'
import { fetchContext as fetch } from '$lib/server/common/fetchContext'

export async function userAuthentication(data) {

  const response = await fetch(FRACTAL_SERVER_HOST + '/auth/token/login', {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    body: data
  })

  if (!response.ok) {
    throw new Error('Authentication failed')
  }

  return await response.json()
}

export async function whoami() {

  const response = await fetch(FRACTAL_SERVER_HOST + '/auth/whoami', {
    method: 'GET',
    credentials: 'include',
    mode: 'cors'
  })

  if (response.ok) {
    return await response.json()
  }

  throw new Error('Unable to fetch user identity')
}