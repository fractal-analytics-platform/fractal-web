import { FRACTAL_SERVER_HOST } from '$env/static/private'

export async function getJob(fetch, jobId) {
  console.log('Fetching job from server')

  const response = await fetch(FRACTAL_SERVER_HOST + `/api/v1/job/${jobId}`, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors'
  })

  if (response.ok) {
    return await response.json()
  }

  throw new Error('The client was not able to retrieve the job')
}