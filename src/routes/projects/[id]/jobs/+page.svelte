<script>
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { DataHandler } from '@vincjo/datatables'
  import { loadProjectContext } from  '$lib/components/projects/controller'
  import { contextProject } from '$lib/stores/projectStores'
  import StatusBadge from '$lib/components/jobs/StatusBadge.svelte'
  import TimestampBadge from '$lib/components/jobs/TimestampBadge.svelte'
  import Th from '$lib/components/common/filterable/Th.svelte'

  // Component properties
  let project = undefined
  let workflows = []
  let datasets = []

  // Project context properties
  $: project = $contextProject.project
  $: workflows = $contextProject.workflows
  $: datasets = $contextProject.datasets

  onMount(async () => {
    // Load project context
    // If $contextProject is not empty, it means that the user has already loaded the project context
    // we don't need to load it again
    if ($contextProject.project) return
    await loadProjectContext($page.params.id)
  })

  const jobs = [
    {
      "project_id": 0,
      "input_dataset_id": 1,
      "output_dataset_id": 3,
      "workflow_id": 1,
      "overwrite_input": false,
      "worker_init": "string",
      "id": 0,
      "start_timestamp": "2023-04-05T12:54:39.657Z",
      "status": "running",
      "log": "string",
      "history": [
        "string"
      ],
      "working_dir": "string",
      "working_dir_user": "string"
    },
    {
      "project_id": 0,
      "input_dataset_id": 3,
      "output_dataset_id": 1,
      "workflow_id": 1,
      "overwrite_input": false,
      "worker_init": "string",
      "id": 1,
      "start_timestamp": "2023-04-05T12:55:39.657Z",
      "status": "done",
      "log": "string",
      "history": [
        "string"
      ],
      "working_dir": "string",
      "working_dir_user": "string"
    },
    {
      "project_id": 0,
      "input_dataset_id": 1,
      "output_dataset_id": 3,
      "workflow_id": 1,
      "overwrite_input": false,
      "worker_init": "string",
      "id": 2,
      "start_timestamp": "2023-04-05T12:56:39.657Z",
      "status": "failed",
      "log": "string",
      "history": [
        "string"
      ],
      "working_dir": "string",
      "working_dir_user": "string"
    },
    {
      "project_id": 0,
      "input_dataset_id": 1,
      "output_dataset_id": 3,
      "workflow_id": 1,
      "overwrite_input": false,
      "worker_init": "string",
      "id": 3,
      "start_timestamp": "2023-04-05T12:57:39.657Z",
      "status": "running",
      "log": "string",
      "history": [
        "string"
      ],
      "working_dir": "string",
      "working_dir_user": "string"
    },
    {
      "project_id": 0,
      "input_dataset_id": 1,
      "output_dataset_id": 3,
      "workflow_id": 1,
      "overwrite_input": false,
      "worker_init": "string",
      "id": 4,
      "start_timestamp": "2023-04-05T12:58:39.657Z",
      "status": "failed",
      "log": "string",
      "history": [
        "string"
      ],
      "working_dir": "string",
      "working_dir_user": "string"
    },
    {
      "project_id": 0,
      "input_dataset_id": 1,
      "output_dataset_id": 3,
      "workflow_id": 1,
      "overwrite_input": false,
      "worker_init": "string",
      "id": 5,
      "start_timestamp": "2023-04-05T12:59:39.657Z",
      "status": "running",
      "log": "string",
      "history": [
        "string"
      ],
      "working_dir": "string",
      "working_dir_user": "string"
    },
    {
      "project_id": 0,
      "input_dataset_id": 3,
      "output_dataset_id": 1,
      "workflow_id": 1,
      "overwrite_input": false,
      "worker_init": "string",
      "id": 6,
      "start_timestamp": "2023-04-05T12:59:49.657Z",
      "status": "submitted",
      "log": "string",
      "history": [
        "string"
      ],
      "working_dir": "string",
      "working_dir_user": "string"
    }
  ]

  // Table handler
  const tableHandler = new DataHandler(jobs)

  // Table data
  const rows = tableHandler.getRows()

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
    <button class="btn btn-light" data-bs-toggle="modal" data-bs-target="#editProjectModal"><i class="bi-gear-wide-connected"></i></button>
  </div>
</div>

{#if project}
  <div class="container">

    <div class="d-flex justify-content-between align-items-center my-3">
      <h1>Project's Jobs</h1>
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
      </tr>
      <tr>
        <th class="col-3">
          <input type="number" class="form-control"
                 on:change|preventDefault={(event) => {tableHandler.filter(event.target.value, 'id')}}>
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
      </tbody>
    </table>
  </div>
{/if}
