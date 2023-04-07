<script>

  import { DataHandler } from '@vincjo/datatables'
  import StatusBadge from '$lib/components/jobs/StatusBadge.svelte'
  import TimestampBadge from '$lib/components/jobs/TimestampBadge.svelte'
  import Th from '$lib/components/common/filterable/Th.svelte'

  const jobs = [
    {
      "project_id": 0,
      "input_dataset_id": 0,
      "output_dataset_id": 0,
      "workflow_id": 0,
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
      "input_dataset_id": 0,
      "output_dataset_id": 0,
      "workflow_id": 0,
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
      "input_dataset_id": 0,
      "output_dataset_id": 0,
      "workflow_id": 0,
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
      "input_dataset_id": 0,
      "output_dataset_id": 0,
      "workflow_id": 0,
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
      "input_dataset_id": 0,
      "output_dataset_id": 0,
      "workflow_id": 0,
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
      "input_dataset_id": 0,
      "output_dataset_id": 0,
      "workflow_id": 0,
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
      "input_dataset_id": 0,
      "output_dataset_id": 0,
      "workflow_id": 0,
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

<h1>Jobs page</h1>

<table class="table">

  <thead class="table-light">
    <tr>
      <Th handler={tableHandler} key="id" label="Id"></Th>
      <Th handler={tableHandler} key="start_timestamp" label="Timestamp"></Th>
      <Th handler={tableHandler} key="status" label="Status"></Th>
    </tr>
  </thead>

  <tbody>
    {#each $rows as row }
      {#key row}
      <tr>
        <td>{row.id}</td>
        <td><TimestampBadge timestamp={row.start_timestamp}></TimestampBadge></td>
        <td><StatusBadge status={row.status}></StatusBadge></td>
      </tr>
      {/key}
    {/each}
  </tbody>
</table>