<script>
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { getDataset } from '$lib/api/v1/project/project_api'

  let projectId = $page.params.id
  let datasetId = $page.params.datasetId

  let dataset = undefined

  onMount(async () => {
    dataset = await getDataset(projectId, datasetId)
      .catch(error => {
        console.error(error)
      })
    console.log(dataset.resource_list)
  })

</script>

<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item" aria-current="page">
      <a href="/projects">Projects</a>
    </li>
    <li class="breadcrumb-item" aria-current="page">
      <a href="/projects/{projectId}">Project</a>
    </li>
    <li class="breadcrumb-item" aria-current="page">Datasets</li>
    {#if dataset}
      <li class="breadcrumb-item active" aria-current="page">{dataset.name}</li>
    {/if}
  </ol>
</nav>

{#if dataset}
  <div class="container">
  <h1>Dataset {dataset.name} #{dataset.id}</h1>

  <div class="row mt-3">

    <div class="col-4">
      <p class="text-muted">Dataset properties</p>
      <ul class="list-group">
        <li class="list-group-item text-bg-light">
          <span>Id</span>
        </li>
        <li class="list-group-item">
          <span>{dataset.id}</span>
        </li>
        <li class="list-group-item text-bg-light">
          <span>Name</span>
        </li>
        <li class="list-group-item">
          <span>{dataset.name}</span>
        </li>
        <li class="list-group-item text-bg-light">
          <span>Type</span>
        </li>
        <li class="list-group-item">
          <span>{dataset.type}</span>
        </li>
        <li class="list-group-item text-bg-light">
          <span>Readonly</span>
        </li>
        <li class="list-group-item">
          <span class="badge bg-secondary">{dataset.read_only}</span>
        </li>
      </ul>
      {#if Object.keys(dataset.meta).length > 0 }
        <p class="text-muted mt-3">Meta properties</p>
        <ul class="list-group">
          {#each Object.entries(dataset.meta) as [key, value] }
            <li class="list-group-item text-bg-light">
              <span class="text-capitalize">{key}</span>
            </li>
            <li class="list-group-item">
              <span class="">{value}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    <div class="col-8">
      <p class="text-muted">Dataset resources</p>
      <table class="table table-bordered caption-top">
        <thead class="bg-light">
          <tr>
            <th class="col-1">Id</th>
            <th class="col-9">Source</th>
            <th class="col-2">Options</th>
          </tr>
        </thead>
        <tbody>
        {#each dataset.resource_list as resource }
          <tr>
            <td>{resource.id}</td>
            <td><code>{resource.path}</code></td>
            <td></td>
          </tr>
        {/each}
        </tbody>
      </table>
    </div>

  </div>

  </div>
{/if}