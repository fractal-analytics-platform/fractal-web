<script>
  import { createEventDispatcher } from 'svelte'
  import { enhance } from '$app/forms'
  import { modalProject } from '$lib/stores/projectStores.js'
  import { createProject, deleteProject } from '$lib/api/v1/project/project_api'
  import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte'
  import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte'

  const dispatch = createEventDispatcher()

  // List of projects to be displayed
  export let projects = []

  function setModalProject(event) {
    const projectId = event.currentTarget.getAttribute('data-fc-project')
    const project = projects.find(p => p.id == projectId)
    modalProject.set(project)
  }

  async function handleCreateProject({ data, cancel, form }) {
    // Prevent default form submit
    cancel()

    await createProject(data)
      .then(() => {
        dispatch('projectCreated')
        form.reset()
      })
      .catch((error) => {
        // Error creating project
        new StandardErrorAlert({
          target: document.getElementById('createProjectErrorAlert'),
          props: {
            error
          }
        })
      })
  }

  async function handleDeleteProject(projectId) {

    await deleteProject(projectId)
      .then(() => {
        projects = projects.filter((p) => p.id != projectId)
      })
      .catch(error => {
        console.error(error)
      })

  }
</script>

<p class="lead">Projects list</p>
<div class="container">
  <div class="row mt-3 mb-3">
    <div class="col-sm-12">
      <form method="post" class="row justify-content-end" use:enhance={handleCreateProject}>
        <div class="col-auto">
          <div class="input-group">
            <div class="input-group-text">Project name</div>
            <input name="projectName" type="text" class="form-control">
          </div>
        </div>
        <div class="col-auto">
          <div class="input-group">
            <div class="input-group-text">Project directory</div>
            <input name="projectDirectory" type="text" class="form-control">
          </div>
        </div>

        <div class="col-auto">
          <button type="submit" class="btn btn-primary">Create</button>
        </div>
      </form>
      <div id="createProjectErrorAlert" class="mt-3"></div>
    </div>
  </div>
  <div class="row">
    <table class="table table-hover align-middle">
      <thead class="table-light">
      <tr>
        <th>Id</th>
        <th>Name</th>
        <th>Options</th>
      </tr>
      </thead>
      <tbody>
      { #each projects as { id, name } }
        <tr>
          <td class="col-1">{id}</td>
          <td class="col-8">{name}</td>
          <td class="col-2 align-right">
            <button data-fc-project="{id}" class="btn btn-light" data-bs-toggle="modal" data-bs-target="#projectInfoModal" on:click={setModalProject}>
              <i class="bi bi-info-circle"></i>
            </button>
            <a href='{"/projects/" + id}' class="btn btn-light">Open <i class="bi bi-arrow-up-right-square"></i></a>
            <ConfirmActionButton
              modalId={"confirmDeleteProject" + id}
              style={'danger'}
              btnStyle="danger"
              message="Delete project {name}"
              buttonIcon="trash"
              callbackAction={handleDeleteProject.bind(this, id)}>
            </ConfirmActionButton>
          </td>
        </tr>
      {/each}
      </tbody>
    </table>
  </div>
</div>

