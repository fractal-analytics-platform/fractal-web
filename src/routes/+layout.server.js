import { FRACTAL_SERVER_HOST } from '$env/static/private'

export async function load() {
  // This is a mark to notify and log when the server is running SSR
  console.log('SSR - Main layout')

  const serverInfo = await fetch(FRACTAL_SERVER_HOST + '/api/alive/', {
    method: 'GET'
  }).then(async (res) => await res.json())

  return {
    serverInfo
  }
}