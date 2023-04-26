import { FRACTAL_SERVER_HOST } from '$env/static/private'
import { setFetch } from '$lib/server/common/fetchContext'
import { whoami } from '$lib/server/api/v1/auth_api'

export async function load({ fetch }) {
  // This is a mark to notify and log when the server is running SSR
  console.log('SSR - Main layout')
  setFetch(fetch)

  const serverInfo = await fetch(FRACTAL_SERVER_HOST + '/api/alive/', {
    method: 'GET'
  }).then(async (res) => await res.json())

  const userInfo = await whoami(fetch)
    .catch(error => {
      console.error(error)
      return null
    })

  return {
    serverInfo,
    userInfo
  }
}