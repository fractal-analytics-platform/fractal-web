<script>
  import { onMount } from 'svelte'
  import { listProjects } from '$lib/api/v1/project/project_api'
  import ProjectsList from '$lib/components/projects/ProjectsList.svelte'
  import ProjectInfoModal from '$lib/components/projects/ProjectInfoModal.svelte'

  let projects = []

  onMount(async () => {
    await updateProjectsList()
  })

  async function getServerProjects() {
    return await listProjects()
      .catch(() => {
        // If there is an error, return an empty list
        return []
      })
  }

  async function updateProjectsList() {
    projects = await getServerProjects()
  }

</script>

<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item active" aria-current="page">Projects</li>
  </ol>
</nav>

<ProjectInfoModal></ProjectInfoModal>

<ProjectsList bind:projects on:projectCreated={updateProjectsList} />