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

<h1>Dataset</h1>