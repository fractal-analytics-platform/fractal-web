import { setFetch } from '$lib/server/common/fetchContext'
import { listProjects, createProject } from '$lib/server/api/v1/project_api'

async function loadProjects() {
  const projects = await listProjects()
    .catch(error => {
      console.error(error)
      return []
    })

  return projects
}

export async function load({ fetch }) {
  // Set fetch function to use in api calls
  setFetch(fetch)

  // Load projects from server
  const projects = await loadProjects()

  return {
    projects
  }
}

export const actions = {

  default: async ({ fetch, request }) => {
    // Set fetch function to use in api calls
    setFetch(fetch)

    // Create project
    const data = await request.formData()
    try {
      const project = await createProject(data)
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