<script>
	import { page } from '$app/stores';
	import ProjectsList from '$lib/components/v2/projects/ProjectsList.svelte';
	import ProjectInfoModal from '$lib/components/v2/projects/ProjectInfoModal.svelte';

	/** @type {import('fractal-components/types/api').ProjectV2[]} */
	const projects = $page.data.projects;
</script>

<ProjectsList {projects} />
<ProjectInfoModal />
