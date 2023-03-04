import { PUBLIC_FRACTAL_SERVER_HOST } from '$env/static/public'

export async function listProjects() {

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + '/api/v1/project', {
    method: 'GET',
    credentials: 'include'
  })

  if (response.ok) {
    return await response.json()
  }

  console.error('Client unable to fetch projects list')
  throw new Error('Unable to list projects')
}