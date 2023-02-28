<script>
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'
  import { modalProject } from '$lib/components/projectStores.js'

  // List of projects to be displayed
  export let projects = []
  // Error property to be set in order to show errors in UI
  let errorReasons = ''

  function setModalProject(event) {
    const projectId = event.currentTarget.getAttribute('data-fc-project')
    const project = projects.find(p => p.id == projectId)
    modalProject.set(project)
  }

  function actionResult(result) {
    if (result) {
      if (result.createAction && !result.createAction.success) {
        // errorReasons = JSON.stringify(result.createAction.reason, undefined, 2)
        setErrorReasons(result.createAction.reason)
      }
    }

    if (result && result.createAction && result.createAction.success) {
      // Success logic
    }
  }

  function setErrorReasons(value) {
    errorReasons = JSON.stringify(value, undefined, 2)
  }

  // Form action hook to handle $page.form updates
  // Every form action comes out with an action result
  // Every action result in $page.form is referenced by a property with the same form action name
  $: actionResult($page.form)

</script>

<h1>Projects</h1>

<div class="container">
  <div class="row mt-3 mb-3">
    <div class="col-sm-12">
      <form method="post" action="?/create" class="row justify-content-end" use:enhance>
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
      {#if errorReasons != '' }
        <div class="row p-4">
          <div class="alert alert-danger">
            <pre>There has been an error, reason:</pre>
            <pre>{errorReasons}</pre>
          </div>
        </div>
      {/if}
    </div>
  </div>
  <div class="row">
    <table class="table table-hover">
      <thead class="table-light">
      <tr>
        <th>Id</th>
        <th>Name</th>
        <th>Directory</th>
        <th>Readonly</th>
        <th>Options</th>
      </tr>
      </thead>
      <tbody>
      { #each projects as { id, name, project_dir, read_only } }
        <tr>
          <td>{id}</td>
          <td>{name}</td>
          <td>{project_dir}</td>
          <td>{read_only}</td>
          <td class="align-right">
            <button data-fc-project="{id}" class="btn btn-light" data-bs-toggle="modal" data-bs-target="#projectInfoModal" on:click={setModalProject}>
              <i class="bi bi-info-circle"></i>
            </button>
            <button class="btn btn-light">Open <i class="bi bi-arrow-up-right-square"></i></button>
            <button class="btn btn-warning" disabled>Edit</button>
            <button class="btn btn-danger" disabled>Delete</button>
          </td>
        </tr>
      {/each}
      </tbody>
    </table>
  </div>
</div>

