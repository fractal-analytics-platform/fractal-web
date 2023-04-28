import { listProjects, createProject } from '$lib/server/api/v1/project_api'

async function loadProjects(fetch) {
  const projects = await listProjects(fetch)
    .catch(error => {
      console.error(error)
      return []
    })

  return projects
}

export async function load({ fetch }) {
  console.log('Load projects page')

  // Load projects from server
  const projects = await loadProjects(fetch)

  return {
    projects
  }
}

export const actions = {

  default: async ({ fetch, request }) => {
    // Set fetch function to use in api calls

    // Create project
    const data = await request.formData()
    try {
      const project = await createProject(fetch, data)
      return {
        project
      }
    } catch(error) {
      return {
        error: error.reason
      }
    }
  }

}