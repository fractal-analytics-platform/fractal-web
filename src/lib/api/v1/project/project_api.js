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

export async function getProject(projectId) {

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}`, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors'
  })

  if (response.ok) {
    // Return fetched project as json object
    return await response.json()
  }

  throw new Error('The client was not able to fetch the project')
}

export async function getDataset(projectId, datasetId) {

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/${datasetId}`, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors'
  })

  if (response.ok) {
    // Return the dataset as json object
    return await response.json()
  }

  throw new Error('The client was not able to fetch the dataset')
}

export async function deleteDataset(projectId, datasetId) {

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + `/api/v1/project/${projectId}/${datasetId}`, {
    method: 'DELETE',
    credentials: 'include',
    mode: 'cors'
  })

  if (response.ok) {
    return true
  }

  throw new Error('The dataset was not deleted by the server')
}