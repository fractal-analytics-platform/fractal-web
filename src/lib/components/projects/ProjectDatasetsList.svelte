<script>
  export let datasets = []

</script>

<div class="container p-0">
  <p class="lead">Datasets</p>
  <table class="table">
    <thead class="table-light">
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>Options</th>
    </tr>
    </thead>
    <tbody>
      {#each datasets as { name, type } }
        <tr>
          <td>{name}</td>
          <td>{type || 'Unknown' }</td>
          <td></td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>