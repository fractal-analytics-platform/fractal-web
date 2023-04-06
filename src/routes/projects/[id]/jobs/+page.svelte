<script>

  import { DataHandler } from '@vincjo/datatables'

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
      "start_timestamp": "2023-04-05T12:54:39.657Z",
      "status": "completed",
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
      "start_timestamp": "2023-04-05T12:54:39.657Z",
      "status": "cancelled",
      "log": "string",
      "history": [
        "string"
      ],
      "working_dir": "string",
      "working_dir_user": "string"
    }
  ]

  const tableHandler = new DataHandler(jobs)

  // Table data
  const rows = tableHandler.getRows()

  // Filtering properties
  let filterColumn = undefined

  function toggleFilterColumn(columnKey) {
    filterColumn = columnKey
  }

  $: {
    tableHandler.sort(filterColumn)
  }

</script>

<h1>Jobs page</h1>

<table class="table">

  <thead>
    <tr>
      <th on:click={toggleFilterColumn.bind(this,'id')}>Id</th>
      <th on:click={toggleFilterColumn.bind(this,'start_timestamp')}>Timestamp</th>
      <th on:click={toggleFilterColumn.bind(this,'status')}>Status</th>
    </tr>
  </thead>

  <tbody>
    {#each $rows as row }
      <tr>
        <td>{row.id}</td>
        <td>{row.start_timestamp}</td>
        <td>{row.status}</td>
      </tr>
    {/each}
  </tbody>
</table>