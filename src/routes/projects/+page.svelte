<script>
    import ProjectsList from '$lib/components/ProjectsList.svelte'
	export let data
</script>

<ProjectsList bind:projects={data.projects}/>