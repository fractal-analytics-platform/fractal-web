<script>
  import { afterUpdate } from 'svelte'
  import { getJob } from '$lib/api/v1/monitoring/monitoring_api'

  export let workflowJobId = undefined
  let logs = ''

  afterUpdate(() => {
    if (workflowJobId) {
      getJob(workflowJobId)
        .then((data) => {
          logs = data.log
        })
        .catch(error => {
          console.log(error)
        })
    }
  })

</script>

<div class="modal" id="workflowJobLogsModal">
  <div class="modal-dialog modal-fullscreen">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="h5 modal-title">Workflow Job logs</h1>
        <button class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body bg-tertiary text-secondary">
        <pre>{ logs }</pre>
      </div>
    </div>
  </div>
</div>
