import { PUBLIC_FRACTAL_SERVER_HOST } from '$env/static/public'
import { PostResourceException } from '$lib/common/errors'

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

export async function createProject(data) {
  // Data is a FormData object

  const requestData = {
    name: data.get('projectName'),
    project_dir: data.get('projectDirectory')
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + '/api/v1/project', {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    headers,
    body: JSON.stringify(requestData)
  })


  if (response.ok) {
    return await response.json()
  }

  throw new PostResourceException(await response.json())
}