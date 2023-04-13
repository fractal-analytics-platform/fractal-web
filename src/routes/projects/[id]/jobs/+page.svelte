<script>
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { DataHandler } from '@vincjo/datatables'
  import { loadProjectContext } from  '$lib/components/projects/controller'
  import { contextProject } from '$lib/stores/projectStores'
  import { getJobs } from '$lib/api/v1/project/project_api'
  import StatusBadge from '$lib/components/jobs/StatusBadge.svelte'
  import TimestampBadge from '$lib/components/jobs/TimestampBadge.svelte'
  import Th from '$lib/components/common/filterable/Th.svelte'

  // Component properties
  let project = undefined
  let workflows = []
  let datasets = []
  let jobs = []
  let tableHandler = undefined
  let rows = undefined

  // Project context properties
  $: project = $contextProject.project
  $: workflows = $contextProject.workflows
  $: datasets = $contextProject.datasets

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
      tableHandler.filter(idFilter, 'id')
    }

    const workflowFilter = $page.url.searchParams.get('workflow')
    if (workflowFilter) {
      tableHandler.filter(workflowFilter, 'workflow_id')
    }

    const inputDatasetFilter = $page.url.searchParams.get('input_dataset')
    if (inputDatasetFilter) {
      tableHandler.filter(inputDatasetFilter, 'input_dataset_id')
    }

    const outputDatasetFilter = $page.url.searchParams.get('output_dataset')
    if (outputDatasetFilter) {
      tableHandler.filter(outputDatasetFilter, 'output_dataset_id')
    }

    const statusFilter = $page.url.searchParams.get('status')
    if (statusFilter) {
      tableHandler.filter(statusFilter, 'status')
    }

  })

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

    // Table handler
    tableHandler = new DataHandler(jobs)
    // Table data
    rows = tableHandler.getRows()
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
    <table class="table">

      <thead class="table-light">
      <tr>
        <Th handler={tableHandler} key="id" label="Id"></Th>
        <Th handler={tableHandler} key="start_timestamp" label="Timestamp"></Th>
        <Th handler={tableHandler} key="workflow_id" label="Workflow"></Th>
        <Th handler={tableHandler} key="input_dataset_id" label="Input dataset"></Th>
        <Th handler={tableHandler} key="output_dataset_id" label="Output dataset"></Th>
        <Th handler={tableHandler} key="status" label="Status"></Th>
      </tr>
      <tr>
        <th class="col-3">
        </th>
        <th></th>
        <th>
          {#if workflows}
            <select class="form-control"
                    on:change={(event) => {tableHandler.filter(event.target.value, 'workflow_id')}}>
            <option value="">All</option>
              {#each workflows as workflow}
                <option value={workflow.id}>{workflow.name}</option>
              {/each}
            </select>
          {/if}
        </th>
        <th>
          <select class="form-control"
                  on:change={(event) => {tableHandler.filter(event.target.value, 'input_dataset_id')}}>
          <option value="">All</option>
            {#each datasets as dataset}
              <option value={dataset.id}>{dataset.name}</option>
            {/each}
          </select>
        </th>
        <th>
          <select class="form-control"
                  on:change={(event) => {tableHandler.filter(event.target.value, 'output_dataset_id')}}>
          <option value="">All</option>
            {#each datasets as dataset}
              <option value={dataset.id}>{dataset.name}</option>
            {/each}
          </select>
        </th>
        <th>
          <select class="form-control" on:change={(event) => {tableHandler.filter(event.target.value, 'status')}}>
          <option value="">All</option>
            <option value="running">Running</option>
            <option value="done">Done</option>
            <option value="failed">Failed</option>
            <option value="submitted">Submitted</option>
          </select>
        </th>
      </tr>
      </thead>

      <tbody>
      {#if rows }
        {#each $rows as row }
          {#key row}
            <tr>
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
            </tr>
          {/key}
        {/each}
      {/if}
      </tbody>
    </table>
    {/if}
  </div>
{/if}
