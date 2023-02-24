<script>
    import ProjectsList from '$lib/components/ProjectsList.svelte'
    import ProjectInfoModal from '$lib/components/ProjectInfoModal.svelte'
 	  export let data
</script>

<ProjectsList bind:projects={data.projects} />

<ProjectInfoModal></ProjectInfoModal>