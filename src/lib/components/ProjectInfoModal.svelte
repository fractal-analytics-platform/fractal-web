<script>
  // ProjectInfoModal component
  import { modalProject } from './projectStores.js'

  // Project to be displayed
  let project = {}

  // Subscription to modalProject store to update project property with respect
  // to the project in the store. Enable app-wide updates to the project to be
  // displayed in this component.
  modalProject.subscribe( projectUpdate => {
    project = projectUpdate
  })

</script>

<div class="modal" id="projectInfoModal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="h5 modal-title">Project {project?.name}</h1>
        <button class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>