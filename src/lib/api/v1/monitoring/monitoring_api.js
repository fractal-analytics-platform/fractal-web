import { PUBLIC_FRACTAL_SERVER_HOST } from '$env/static/public'

export async function getJob(jobId) {

  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + `/api/v1/job/${jobId}`, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors'
  })

  if (response.ok) {
    return await response.json()
  }

  throw new Error('The client was not able to retrieve the job')
}