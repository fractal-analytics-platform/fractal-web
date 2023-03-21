import { PUBLIC_FRACTAL_SERVER_HOST } from '$env/static/public'
import { PostResourceException } from '$lib/common/errors'

export async function createWorkflow(formData) {

  const requestData = {
    name: formData.get('workflowName'),
    project_id: formData.get('projectId')
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + `/api/v1/workflow/`, {
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

export async function getWorkflow(workflowId) {

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + `/api/v1/workflow/${workflowId}`, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors'
  })

  if (response.ok) {
    return await response.json()
  }

  throw new Error('The client was not able to retrieve the workflow')
}

export async function deleteWorkflow(workflowId) {

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + `/api/v1/workflow/${workflowId}`, {
    method: 'DELETE',
    credentials: 'include',
    mode: 'cors'
  })

  if (response.ok) {
    return true
  }

  throw new Error('The client was not able to delete the workflow')
}

export async function createWorkflowTask(workflowId, formData) {

  const requestBody = {
    meta: {},
    args: {},
    task_id: formData.get('taskId'),
    workflow_id: workflowId
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + `/api/v1/workflow/${workflowId}/add-task/`,{
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

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + `/api/v1/workflow/${workflowId}/edit-task/${workflowTaskId}`,{
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