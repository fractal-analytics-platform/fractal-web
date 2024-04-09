<script>
	import { page } from '$app/stores';
	import ProjectsList from '$lib/components/v1/projects/ProjectsList.svelte';
	import ProjectInfoModal from '$lib/components/v1/projects/ProjectInfoModal.svelte';

	/** @type {import('$lib/types').Project[]} */
	const projects = $page.data.projects;
</script>

<ProjectsList {projects} />
<ProjectInfoModal />
