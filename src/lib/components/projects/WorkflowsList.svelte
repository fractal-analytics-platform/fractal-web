<script>

  export let workflows = []

</script>

<div class="container p-0 mt-4">
  <p class="lead">Workflows</p>
  <table class="table align-middle">
    <thead class="table-light">
      <tr>
        <th>Id</th>
      </tr>
    </thead>
    <tbody>
      {#each workflows as { id }}
        <tr>
          <td>{id}</td>
        </tr>
      {/each}
    </tbody>
  </table>

</div>