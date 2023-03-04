<script>
  import { onMount } from 'svelte'
  import { listProjects } from '$lib/api/v1/project/project_api'
  import ProjectsList from '$lib/components/ProjectsList.svelte'
  import ProjectInfoModal from '$lib/components/ProjectInfoModal.svelte'

  let projects = []

  onMount(async () => {
    const projectList = await listProjects().catch(() => {
      return []
    })
    projects = projectList
  })

</script>

<ProjectInfoModal></ProjectInfoModal>
<ProjectsList bind:projects />