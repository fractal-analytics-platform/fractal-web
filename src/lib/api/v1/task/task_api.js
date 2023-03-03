import { PUBLIC_FRACTAL_SERVER_HOST } from '$env/static/public'

export async function list_tasks(fetch, cookies) {

  // Set headers
  const headers = new Headers()
  headers.append('Authorization', cookies.get('AccessToken'))

  // Compose request
  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + '/api/v1/task/', {
    method: 'GET',
    headers: headers
  })
    // Handle response
    .then(response => {
      return response.json()
    })

  // The response should be of form ActionResult
  return response
}

export async function create_task(serverFetch, cookies, formData) {

  // Set headers
  const headers = new Headers()
  headers.append('Authorization', cookies.get('AccessToken'))
  headers.append('Content-Type', 'application/json')

  // Compose request
  // Since the api accepts application/json data format, we shall serialize data
  // into a json object. It is better to do this explicitly.
  const task_data = {
    name: formData.get('name'),
    command: formData.get('command'),
    source: formData.get('source'),
    input_type: formData.get('input_type'),
    output_type: formData.get('output_type')
  }
  // There is an interesting thing, if we use the svelte kit fetch object the server will not
  // accept our request. If, instead, we use the default javascript fetch the server accepts it.
  const actionResult = await fetch(PUBLIC_FRACTAL_SERVER_HOST + '/api/v1/task/', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(task_data)
  })
    .then(async response => {
      // Should check that the response is successful or not
      if (response.status !== 201) {
        return {
          createAction: {
            success: false,
            reason: await response.json()
          }
        }
      }
      return {
        createAction: {
          success: true
          // Additional data if necessary
        }
      }
    })

  return actionResult
}

export async function create_task_collection(fetch, cookies, formData) {

  const headers = new Headers()
  headers.append('Authorization', cookies.get('AccessToken'))
  headers.append('Content-Type', 'application/json')

  const request_data = {
    package: formData.get('package'),
    // Optional
    version: formData.get('version'),
    python_version: formData.get('python_version'),
    package_extras: formData.get('package_extras')
  }

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + '/api/v1/task/collect/pip/', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(request_data) // The body must be serialized to json since the server accepts application/json
  })

  const status = response.status

  if (status === 500) {
    // If there is an internal server error, no task collection has started
    return {
      success: false,
      reason: 'The server faced an internal error'
    }
  }

  if (response.status !== 200 && response.status !== 201) {
    // There is an error, let's get the details from the server
    const data = await response.json()
    return {
      success: false,
      reason: data
    }
  }

  // If the response is successful
  // Return an action result
  return {
    success: true,
    data: await response.json()
  }
}

export async function task_collection_status(fetch, cookies, task_id) {

  const headers = new Headers()
  headers.append('Authorization', cookies.get('AccessToken'))

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + `/api/v1/task/collect/${task_id}`,{
    method: 'GET',
    headers
  })

  if (response.status === 200) {
    const data = await response.json()
    console.log(data)
    return data
  }

  throw new Error('Unable to fetch collection operation status')
}
