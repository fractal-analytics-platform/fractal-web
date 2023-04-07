import { getProject, getWorkflows } from '$lib/api/v1/project/project_api'
import { contextProject } from '$lib/stores/projectStores'

export async function loadProjectContext(projectId) {
  await getProject(projectId)
    .then((project) => {
      contextProject.update(context => {
        context.project = project
        return context
      });
    })
    .catch((error) => {
      console.error(error)
    })

  await getWorkflows(projectId)
    .then((workflows) => {
      contextProject.update(context => {
        context.workflows = workflows
        return context
      })
    })
    .catch(error => {
      console.error(error)
    })
}