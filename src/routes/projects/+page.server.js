import { list_projects } from '$lib/api/v1/project/project_api.js'

export async function load({ fetch, cookies }) {
  return {
    projects: await list_projects(fetch, cookies)
  }
}

export const actions = {
  create: async (event) => {
    // Handle the create request of a new project

    const formData = await event.request.formData()

    const createActionResult = await event.fetch('http://127.0.0.1:8000/api/v1/project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': event.cookies.get('AccessToken')
      },
      body: JSON.stringify({
        name: formData.get('projectName'),
        project_dir: formData.get('projectDirectory')
      })
    })
      .then(async response => {
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
          }
        }
      })

    return createActionResult
  }
}