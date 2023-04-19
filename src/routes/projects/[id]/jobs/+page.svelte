<script>
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { DataHandler, check } from '@vincjo/datatables'
  import { loadProjectContext } from  '$lib/components/projects/controller'
  import { contextProject } from '$lib/stores/projectStores'
  import { getJobs } from '$lib/api/v1/project/project_api'
  import { downloadWorkflowJobLog } from '$lib/api/v1/workflow/workflow_api'
  import StatusBadge from '$lib/components/jobs/StatusBadge.svelte'
  import TimestampBadge from '$lib/components/jobs/TimestampBadge.svelte'
  import JobInfoModal from '$lib/components/jobs/JobInfoModal.svelte'
  import JobLogsModal from '$lib/components/jobs/JobLogsModal.svelte'
  import Th from '$lib/components/common/filterable/Th.svelte'

  // Component properties
  let project = undefined
  let workflows = []
  let datasets = []
  let jobs = []
  let tableHandler = undefined
  let rows = undefined
  let workflowJobInfoId = undefined

  // Project context properties
  $: project = $contextProject.project
  $: workflows = $contextProject.workflows
  $: datasets = $contextProject.datasets

  // Filters
  let workflowFilter = ''
  let inputDatasetFilter = ''
  let outputDatasetFilter = ''
  let statusFilter = ''

  onMount(async () => {
    // Load project context
    console.log('Loading project context...')
    // If $contextProject is not empty, it means that the user has already loaded the project context
    // we don't need to load it again
    if ($contextProject.project === undefined) {
      await loadProjectContext($page.params.id)
    }

    await loadProjectJobs()

    // Set filters
    const idFilter = $page.url.searchParams.get('id')
    if (idFilter) {
      tableHandler.filter(idFilter, 'id', check.isEqualTo)
    }

    let workflowQueryFilter = $page.url.searchParams.get('workflow')
    if (workflowQueryFilter) {
      tableHandler.filter(workflowQueryFilter, 'workflow_id', check.isEqualTo)
    }

    let inputDatasetQueryFilter = $page.url.searchParams.get('input_dataset')
    if (inputDatasetQueryFilter) {
      tableHandler.filter(inputDatasetQueryFilter, 'input_dataset_id', check.isEqualTo)
    }

    let outputDatasetQueryFilter = $page.url.searchParams.get('output_dataset')
    if (outputDatasetQueryFilter) {
      tableHandler.filter(outputDatasetQueryFilter, 'output_dataset_id', check.isEqualTo)
    }

    let statusQueryFilter = $page.url.searchParams.get('status')
    if (statusQueryFilter) {
      tableHandler.filter(statusQueryFilter, 'status', check.isEqualTo)
    }

  })

  setupTableHandler()

  // Filters
  $: tableHandler.filter(workflowFilter, 'workflow_id', check.isEqualTo)
  $: tableHandler.filter(inputDatasetFilter, 'input_dataset_id', check.isEqualTo)
  $: tableHandler.filter(outputDatasetFilter, 'output_dataset_id', check.isEqualTo)
  $: tableHandler.filter(statusFilter, 'status')

  async function loadProjectJobs() {
    // Load project jobs
    console.log('Loading project jobs...')
    jobs = await getJobs($page.params.id)
      .then((response) => {
        return response
      })
      .catch((error) => {
        console.error(error)
        return []
      })
    tableHandler.setRows(jobs)
  }

  function setupTableHandler() {
    // Table handler
    tableHandler = new DataHandler(jobs)
    // Table data
    rows = tableHandler.getRows()
  }

  async function handleJobLogsDownload(jobId) {
    console.log('Download job')

    const downloadUrl = await downloadWorkflowJobLog(jobId)
      .then(blob => {
        // Create a download URL for the file
        return URL.createObjectURL(blob)
      })
      .catch(error => {
        console.error(error)
      })

    // Create a hidden link within the page to trigger the download of the file
    const link = document.createElement('a')
    // Append the link to the body
    document.body.appendChild(link)
    // Set the href of the link to the download URL
    link.href = downloadUrl
    link.download = `${jobId}_logs.zip`
    // Trigger the download
    link.click()
    document.body.removeChild(link)
  }

</script>

<div class="d-flex justify-content-between align-items-center">
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb">
      <li class="breadcrumb-item" aria-current="page">
        <a href="/projects">Projects</a>
      </li>
      {#if project}
        <li class="breadcrumb-item" aria-current="page">
          <a href="/projects/{project.id}">{project.name}</a>
        </li>
      {/if}
      <li class="breadcrumb-item active" aria-current="page">Jobs</li>
    </ol>
  </nav>
  <div>
  </div>
</div>

{#if project}
  <div class="container">

    <div class="d-flex justify-content-between align-items-center my-3">
      <h1>Project's Jobs</h1>
    </div>

    {#if tableHandler }
    <div class="d-flex justify-content-end align-items-center my-3">
      <div>
        <button class="btn btn-warning" on:click={
          () => {
            tableHandler.clearFilters()
            workflowFilter = ''
            inputDatasetFilter = ''
            outputDatasetFilter = ''
            statusFilter = ''
          }
        }>
          <i class="bi-x-square"></i>
          Clear filters
        </button>
        <button class="btn btn-primary" on:click={() => {
          // Refresh jobs list
          loadProjectJobs()
        }}><i class="bi-arrow-clockwise"></i> Refresh</button>
      </div>
    </div>
    <table class="table">

      <thead class="table-light">
      <tr>
        <Th handler={tableHandler} key="id" label="Id"></Th>
        <Th handler={tableHandler} key="start_timestamp" label="Timestamp"></Th>
        <Th handler={tableHandler} key="workflow_id" label="Workflow"></Th>
        <Th handler={tableHandler} key="input_dataset_id" label="Input dataset"></Th>
        <Th handler={tableHandler} key="output_dataset_id" label="Output dataset"></Th>
        <Th handler={tableHandler} key="status" label="Status"></Th>
        <th>Options</th>
      </tr>
      <tr>
        <th class="col-3">
        </th>
        <th></th>
        <th>
          {#if workflows}
            <select class="form-control" bind:value={workflowFilter}>
            <option value="">All</option>
              {#each workflows as workflow}
                <option value={workflow.id}>{workflow.name}</option>
              {/each}
            </select>
          {/if}
        </th>
        <th>
          {#key inputDatasetFilter}
            <select class="form-control" bind:value={inputDatasetFilter}>
              <option value="">All</option>
              {#each datasets as dataset}
                <option value={dataset.id}>{dataset.name}</option>
              {/each}
            </select>
          {/key}
        </th>
        <th>
          <select class="form-control" bind:value={outputDatasetFilter}>
            <option value="">All</option>
            {#each datasets as dataset}
              <option value={dataset.id}>{dataset.name}</option>
            {/each}
          </select>
        </th>
        <th>
          <select class="form-control" bind:value={statusFilter}>
          <option value="">All</option>
            <option value="running">Running</option>
            <option value="done">Done</option>
            <option value="failed">Failed</option>
            <option value="submitted">Submitted</option>
          </select>
        </th>
        <th></th>
      </tr>
      </thead>

      <tbody>
      {#if rows }
        {#each $rows as row }
          {#key row }
            <tr class="align-middle">
              <td>{row.id}</td>
              <td>
                <TimestampBadge timestamp={row.start_timestamp}></TimestampBadge>
              </td>
              <td>
                {#if workflows}
                  { workflows.find(workflow => workflow.id === row.workflow_id).name }
                {/if}
              </td>
              <td>
                {#if datasets}
                  { datasets.find(dataset => dataset.id === row.input_dataset_id).name }
                {/if}
              </td>
              <td>
                {#if datasets}
                  { datasets.find(dataset => dataset.id === row.output_dataset_id).name }
                {/if}
              </td>
              <td>
                <StatusBadge status={row.status}></StatusBadge>
              </td>
              <td>
                <button class="btn btn-info" on:click={() => {
                  workflowJobInfoId = row.id
                  const infoModal = new bootstrap.Modal(document.getElementById('workflowJobInfoModal'),{})
                  infoModal.show()
                }}><i class="bi-info-circle"></i> Info</button>
                {#if row.status === 'failed' || row.status === 'done'}
                  <button class="btn btn-light" on:click={() => {
                    workflowJobInfoId = row.id
                    const logsModal = new bootstrap.Modal(document.getElementById('workflowJobLogsModal'),{})
                    logsModal.show()
                  }}>
                    <i class="bi-list-columns-reverse"></i>
                    Logs
                  </button>
                  <button class="btn btn-light" on:click={handleJobLogsDownload.bind(this, row.id)}><i class="bi-arrow-down-circle"></i></button>
                {/if}
              </td>
            </tr>
          {/key}
        {/each}
      {/if}
      </tbody>
    </table>
    {/if}
  </div>
{/if}

<JobInfoModal workflowJobId={workflowJobInfoId}></JobInfoModal>
<JobLogsModal workflowJobId={workflowJobInfoId}></JobLogsModal>