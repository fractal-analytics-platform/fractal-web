<script>
  import { onMount } from 'svelte'
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { loadProjectContext } from '$lib/components/projects/controller'
  import { contextProject } from '$lib/stores/projectStores'
  import { updateProject } from '$lib/api/v1/project/project_api'
  import ProjectDatasetsList from '$lib/components/projects/ProjectDatasetsList.svelte'
  import WorkflowsList from '$lib/components/projects/WorkflowsList.svelte'

  // Component properties
  let project
  let workflows
  let projectUpdatesSuccess = undefined

  $: project = $contextProject.project
  $: workflows = $contextProject.workflows

  onMount(async () => {
    project = undefined
    workflows = []
    await loadProjectContext($page.params.id)
  })

  function handleProjectPropertiesUpdate({ data, cancel }) {
    // Prevent the form from submitting
    cancel()

    // Update the project
    updateProject($page.params.id, data)
      .then((updatedProject) => {
        project = updatedProject
        projectUpdatesSuccess = true
        setTimeout(() => {
          projectUpdatesSuccess = undefined
        }, 3000)
      })
      .catch(error => {
        console.error(error)
        projectUpdatesSuccess = false
      })
  }

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
    <button class="btn btn-light" data-bs-toggle="modal" data-bs-target="#editProjectModal"><i class="bi-gear-wide-connected"></i></button>
    <a href={`/projects/${project?.id}/jobs`}>Workflow jobs</a>
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

<div class="modal" id="editProjectModal">

  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Project properties</h5>
        <button class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">

        {#if project}
          <form id="updateProject" method="post" use:enhance={handleProjectPropertiesUpdate}>

            <div class="mb-3">
              <label for="projectName" class="form-label">Project name</label>
              <input type="text" class="form-control" name="projectName" id="projectName" value="{project.name}">
            </div>

          </form>
        {/if}

      </div>
      <div class="modal-footer">
        {#if projectUpdatesSuccess}
          <div class="m-2 p-2 alert alert-success d-flex align-items-center">
            <i class="bi bi-check-circle"></i>
            <div class="ms-2">
              Properties updated
            </div>
          </div>
        {:else if projectUpdatesSuccess === false}
          <div class="m-2 p-2 alert alert-danger d-flex align-items-center">
            <i class="bi bi-x-circle"></i>
            <div class="ms-2">
              Error while updating properties
            </div>
          </div>
        {/if}
        <button class="btn btn-primary" form="updateProject">Save</button>
      </div>
    </div>
  </div>

</div>
