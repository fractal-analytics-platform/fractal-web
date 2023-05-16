import { getProject, getWorkflows, getJobs } from '$lib/server/api/v1/project_api'

export async function load({ fetch, params }) {

  const { projectId } = params

  const project = await getProject(fetch, projectId)
    .catch(error => console.error(error))

  const workflows = await getWorkflows(fetch, projectId)
    .catch(error => console.error(error))

  const jobs = await getJobs(fetch, projectId)
    .catch(error => console.error(error))

  return {
    project: project || undefined,
    workflows: workflows || [],
    datasets: project.dataset_list || [],
    jobs
  }
}