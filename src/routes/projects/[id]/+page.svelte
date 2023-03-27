<script>
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { getProject, getWorkflows } from '$lib/api/v1/project/project_api'
  import ProjectDatasetsList from '$lib/components/projects/ProjectDatasetsList.svelte'
  import WorkflowsList from '$lib/components/projects/WorkflowsList.svelte'

  let project = undefined
  let workflows = []

  onMount(async () => {
    project = await getProject($page.params.id)
      .catch(error => {
        console.error(error)
      })

    workflows = await getWorkflows($page.params.id)
      .catch(error => {
        console.error(error)
      })
  })

</script>


<div class="d-flex justify-content-between align-items-center">
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb">
      <li class="breadcrumb-item" aria-current="page">
        <a href="/projects">Projects</a>
      </li>
      {#if project}
        <li class="breadcrumb-item active" aria-current="page">{project.name}</li>
      {/if}
    </ol>
  </nav>
  <div>
  </div>
</div>

{#if project}
  <div class="container">
    <div class="d-flex justify-content-between align-items-center my-3">
      <h1>Project {project.name} #{project.id}</h1>
    </div>

    <ProjectDatasetsList datasets={project.dataset_list}></ProjectDatasetsList>
    <WorkflowsList {workflows} projectId={project.id}></WorkflowsList>
  </div>
{/if}
