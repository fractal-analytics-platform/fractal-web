import { FRACTAL_SERVER_HOST } from '$env/static/private'
import { whoami } from '$lib/server/api/v1/auth_api'

export async function load({ fetch }) {
  // This is a mark to notify and log when the server is running SSR
  console.log('SSR - Main layout')

  const serverInfo = await fetch(FRACTAL_SERVER_HOST + '/api/alive/')
    .then(async (res) => {
      const info = await res.json()
      console.log(`Server info loaded: Alive ${info.alive} - ${info.version} - ${info.deployment_type}`)
      return info
    })
    .catch(error => {
      console.log('Error loading server info')
      console.error(error)
    })

  const userInfo = await whoami(fetch)
    .catch(error => {
      console.log('Error loading user info')
      console.error(error)
      return null
    })

  return {
    serverInfo,
    userInfo
  }
}