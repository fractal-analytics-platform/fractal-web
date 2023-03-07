<script>
  import { modalTaskCollectionId } from '$lib/stores/taskStores'
  import { taskCollectionStatus } from '$lib/api/v1/task/task_api'


  let logs = ''

  modalTaskCollectionId.subscribe(async taskCollectionId => {
    if (taskCollectionId !== undefined) {
      await taskCollectionStatus(taskCollectionId)
        .then(status => {
          getTaskCollectionLogs(status.data.log)
        })
        .catch(error => {
          console.error(error)
        })
    }
  })

  async function getTaskCollectionLogs(collectionLogs) {
    logs = collectionLogs
  }
</script>

<div class="modal" id="collectionTaskLogsModal">
  <div class="modal-dialog modal-fullscreen">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="h5 modal-title">Task collection logs</h1>
        <button class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body bg-tertiary text-secondary">
        <pre>{ logs }</pre>
      </div>
    </div>
  </div>
</div>