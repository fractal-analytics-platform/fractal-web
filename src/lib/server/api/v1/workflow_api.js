import { FRACTAL_SERVER_HOST } from '$env/static/private'
import { PostResourceException } from '$lib/common/errors'

export async function createWorkflow(fetch, projectId, formData) {

  const requestData = {
    name: formData.get('workflowName'),
    project_id: projectId
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/workflow/`, {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    headers,
    body: JSON.stringify(requestData)
  })

  if (response.ok) {
    // Return the created workflow object as json
    return await response.json()
  }

  throw new PostResourceException(await response.json())
}

export async function getWorkflow(fetch, workflowId) {

  const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/workflow/${workflowId}`, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors'
  })

  if (response.ok) {
    return await response.json()
  }

  throw new Error('The client was not able to retrieve the workflow')
}

export async function updateWorkflow(workflowId, formData) {

  // This method should patch some properties of a workflow resource
  const requestData = {
    name: formData.get('workflowName')
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/workflow/${workflowId}`,{
    method: 'PATCH',
    credentials: 'include',
    mode: 'cors',
    headers,
    body: JSON.stringify(requestData)
  })

  if (response.ok) {
    return await response.json()
  }

  return PostResourceException(await response.json())
}

export async function reorderWorkflow(workflowId, workflowTasksOrder) {

  const patchData = {
    "reordered_workflowtask_ids": workflowTasksOrder
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/workflow/${workflowId}`,{
    method: 'PATCH',
    credentials: 'include',
    mode: 'cors',
    headers,
    body: JSON.stringify(patchData)
  })

  if (response.ok) {
    return await response.json()
  }

  throw new Error('The client was not able to update the workflow order')
}

export async function deleteWorkflow(fetch, workflowId) {

  const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/workflow/${workflowId}`, {
    method: 'DELETE',
    credentials: 'include',
    mode: 'cors'
  })

  if (response.ok) {
    return true
  }

  throw new Error('The client was not able to delete the workflow')
}

export async function exportWorkflow(workflowId) {

  const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/workflow/${workflowId}/export`, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors'
  })

  if (response.ok) {
    return await response.json()
  }

  throw new Error('The client was not able to retrieve the workflow export data from the server')
}

export async function createWorkflowTask(workflowId, formData) {

  const requestBody = {
    order: formData.get('taskOrder') || undefined,
    meta: {},
    args: {},
    task_id: formData.get('taskId'),
    workflow_id: workflowId
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/workflow/${workflowId}/add-task/`,{
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    headers,
    body: JSON.stringify(requestBody)
  })

  if (response.ok) {
    return await response.json()
  }

  throw new PostResourceException(await response.json())
}

export async function updateWorkflowTaskArguments(workflowId, workflowTaskId, args) {

  const requestBody = {
    args: args
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/workflow/${workflowId}/edit-task/${workflowTaskId}`,{
    method: 'PATCH',
    credentials: 'include',
    mode: 'cors',
    headers,
    body: JSON.stringify(requestBody)
  })

  if (response.ok) {
    console.log('Response successful')
    return await response.json()
  }

  throw new PostResourceException(await response.json())
}

export async function updateWorkflowTaskMetadata(workflowId, workflowTaskId, meta) {

  const requestBody = {
    meta: meta
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/workflow/${workflowId}/edit-task/${workflowTaskId}`,{
    method: 'PATCH',
    credentials: 'include',
    mode: 'cors',
    headers,
    body: JSON.stringify(requestBody)
  })

  if (response.ok) {
    console.log('Response successful')
    return await response.json()
  }

  throw new PostResourceException(await response.json())
}

export async function deleteWorkflowTask(workflowId, workflowTaskId){

  const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/workflow/${workflowId}/rm-task/${workflowTaskId}`,{
    method: 'DELETE',
    credentials: 'include',
    mode: 'cors'
  })

  if (response.ok)
    return true

  throw new Error('The client was not able to delete the workflow task')
}

// Apply a workflow
export async function applyWorkflow(projectId, workflowId, formData) {

  const requestBody = {
    workflow_id: workflowId,
    project_id: projectId,
  }

  // Set input dataset if provided
  if (formData.get('inputDataset')) {
    requestBody.input_dataset_id = formData.get('inputDataset')
  }
  // Set output dataset if provided
  if (formData.get('outputDataset')) {
    requestBody.output_dataset_id = formData.get('outputDataset')
  }
  // Set worker_init if provided
  if (formData.get('workerInit')) {
    requestBody.worker_init = formData.get('workerInit')
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/project/apply/`, {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    headers,
    body: JSON.stringify(requestBody)
  })

  if (response.ok) {
    return await response.json()
  }

  throw new PostResourceException(await response.json())
}

// Download a workflow job log as zip file
export async function downloadWorkflowJobLog(workflowJobId) {

    const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/job/download/${workflowJobId}`, {
      method: 'GET',
      credentials: 'include',
      mode: 'cors'
    })

    if (response.ok) {
      // The API uses a StreamResponse to stream the zip file to the client
      // Get a stream reader from the body
      const reader = response.body.getReader()
      // Read the stream and create a blob
      const readableStream = new ReadableStream({
        start(controller) {
          return pump()
          function pump() {
            return reader.read().then(({ done, value }) => {
              // When no more data needs to be consumed, close the stream
              if (done) {
                controller.close()
                return
              }
              // Enqueue the next data chunk into our target stream
              controller.enqueue(value)
              return pump()
            })
          }
        }
      })
      // Create a blob from the stream
      const blob = await new Response(readableStream).blob()
      return blob
    }

    throw new Error('The client was not able to retrieve the workflow job log from the server')
}
