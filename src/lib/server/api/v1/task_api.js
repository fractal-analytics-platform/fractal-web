import { FRACTAL_SERVER_HOST } from '$env/static/private'
import { PostResourceException } from "$lib/common/errors.js";

export async function listTasks(fetch) {
  console.log('Server fetching tasks')

  // Compose request
  const response = await fetch(FRACTAL_SERVER_HOST + '/api/v1/task/', {
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
  })

  if (!response.ok) {
    throw new Error('Unable to fetch tasks')
  }

  // The response should be of form ActionResult
  return await response.json()
}

export async function createTask(fetch, formData) {

  // Set headers
  const headers = new Headers()
  // headers.append('Authorization', cookies.get('AccessToken'))
  headers.append('Content-Type', 'application/json')

  // Compose request
  // Since the api accepts application/json data format, we shall serialize data
  // into a json object. It is better to do this explicitly.
  const requestData = {
    name: formData.get('name'),
    command: formData.get('command'),
    source: formData.get('source'),
    input_type: formData.get('input_type'),
    output_type: formData.get('output_type')
  }
  // There is an interesting thing, if we use the svelte kit fetch object the server will not
  // accept our request. If, instead, we use the default javascript fetch the server accepts it.
  const response = await fetch(FRACTAL_SERVER_HOST + '/api/v1/task/', {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    headers,
    body: JSON.stringify(requestData)
  })

  if (response.ok) {
    return await response.json()
  }

  throw new PostResourceException(await response.json())
}

export async function createTaskCollection(fetch, formData) {

  const headers = new Headers()
  headers.append('Content-Type', 'application/json')

  const requestData = {
    package: formData.get('package'),
    // Optional
    version: formData.get('version'),
    python_version: formData.get('python_version'),
    package_extras: formData.get('package_extras')
  }

  const response = await fetch(FRACTAL_SERVER_HOST + '/api/v1/task/collect/pip/', {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    headers: headers,
    body: JSON.stringify(requestData) // The body must be serialized to json since the server accepts application/json
  })

  if (response.ok) {
    const responseData = await response.json()
    if (response.status === 200) {
      return {
        info: responseData.data.info,
        status: response.status
      }
    }
    return responseData
  }

  throw new PostResourceException(await response.json())
}

export async function taskCollectionStatus(fetch, taskId) {

  const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/task/collect/${taskId}?verbose=True`,{
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  })

  if (response.ok) {
    return await response.json()
  }

  throw new Error('Unable to fetch collection operation status')
}
