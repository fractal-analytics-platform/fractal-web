<script>
  import { modalTaskCollectionId } from '$lib/stores/taskStores'

  let logs = ''

  modalTaskCollectionId.subscribe(async taskCollectionId => {
    if (taskCollectionId !== undefined) {
      fetchTaskCollectionStatus(taskCollectionId)
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

  async function fetchTaskCollectionStatus(collectionId) {

    const request = await fetch(`/tasks/collections/${collectionId}`, {
      method: 'GET',
      credentials: 'include'
    })

    if (request.ok) {
      return await request.json()
    }

    throw new Error(`Failed to fetch task collection status: ${request.status}`)
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