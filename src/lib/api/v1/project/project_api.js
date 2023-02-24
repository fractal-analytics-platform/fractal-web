import { PUBLIC_FRACTAL_SERVER_HOST } from '$env/static/public'

export async function list_projects(fetch, cookies) {

  // Set headers
  const headers = new Headers()
  headers.append('Authorization', cookies.get('AccessToken'))

  // Compose request
  const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + '/api/v1/project', {
    method: 'GET',
    headers: headers
  })
    // Handle response
    .then(response => {
      console.log('LIST PROJECTS REQUEST', response.status)
      return response.json()
    })

  console.log(response)

  return response
}