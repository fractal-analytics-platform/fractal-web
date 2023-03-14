<script>
  // ProjectInfoModal component
  import { modalProject } from '$lib/stores/projectStores'

  // Project to be displayed
  let project = {}

  // Subscription to modalProject store to update project property with respect
  // to the project in the store. Enable app-wide updates to the project to be
  // displayed in this component.
  modalProject.subscribe( projectUpdate => {
    project = projectUpdate
  })

</script>

<div class="modal modal-lg" id="projectInfoModal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="h5 modal-title">Project {project?.name}</h1>
        <button class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="row mb-3">
          <div class="col-12">
            <p class="lead">Project properties</p>
            <ul class="list-group">
              <li class="list-group-item list-group-item-light fw-bold">Name</li>
              <li class="list-group-item">{project?.name}</li>
              <li class="list-group-item list-group-item-light fw-bold">Directory</li>
              <li class="list-group-item">{project?.project_dir}</li>
              <li class="list-group-item list-group-item-light fw-bold">Read only</li>
              <li class="list-group-item">{project?.read_only ? "Yes" : "No"}</li>
            </ul>
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            {#if project?.dataset_list }
              <p class="lead">Datasets</p>
              <table class="table">
                <thead class="table-light">
                <tr>
                  <th>Name</th>
                  <th>Readonly</th>
                  <th># Resources</th>
                  <th>Type</th>
                </tr>
                </thead>
                <tbody>
                {#each project?.dataset_list as { name, read_only, resource_list, type }}
                  <tr>
                    <td>{name}</td>
                    <td>{read_only ? "Yes" : "No" }</td>
                    <td>{resource_list.length}</td>
                    <td>{type == "" ? "Unknown" : type}</td>
                  </tr>
                {/each}
                </tbody>
              </table>
            {/if}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" disabled>Open project</button>
        <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>