<script>
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { getProject } from '$lib/api/v1/project/project_api'
  import ProjectDatasetsList from '$lib/components/projects/ProjectDatasetsList.svelte'

  let project = undefined

  onMount(async () => {
    project = await getProject($page.params.id)
      .catch((e) => {
        console.error(e)
      })
  })

</script>

<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item" aria-current="page">
      <a href="/projects">Projects</a>
    </li>
    {#if project}
      <li class="breadcrumb-item active" aria-current="page">{project.name}</li>
    {/if}
  </ol>
</nav>

{#if project}
  <h1>Project</h1>

  <ProjectDatasetsList datasets={project.dataset_list}></ProjectDatasetsList>
{/if}
