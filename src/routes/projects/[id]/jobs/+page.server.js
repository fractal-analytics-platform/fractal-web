import { getProject, getWorkflows, getJobs } from '$lib/server/api/v1/project_api'

export async function load({ fetch, params }) {

  const project = await getProject(fetch, params.id)
    .catch(error => console.error(error))

  const workflows = await getWorkflows(fetch, params.id)
    .catch(error => console.error(error))

  const jobs = await getJobs(fetch, params.id)
    .catch(error => console.error(error))

  return {
    project: project || undefined,
    workflows: workflows || [],
    datasets: project.dataset_list || [],
    jobs
  }
}