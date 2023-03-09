<script>

  export let workflows = []

</script>

<div class="container p-0 mt-4">
  <p class="lead">Workflows</p>
  <table class="table align-middle">
    <thead class="table-light">
      <tr>
        <th class="col-4">Id</th>
        <th class="col-4">Name</th>
        <th>Options</th>
      </tr>
    </thead>
    <tbody>
      {#each workflows as { id, name }}
        <tr>
          <td>{id}</td>
          <td>{name}</td>
          <td></td>
        </tr>
      {/each}
    </tbody>
  </table>

</div>