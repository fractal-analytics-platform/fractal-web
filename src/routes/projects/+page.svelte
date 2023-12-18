<script>
	import { page } from '$app/stores';
	import ProjectsList from '$lib/components/projects/ProjectsList.svelte';
	import ProjectInfoModal from '$lib/components/projects/ProjectInfoModal.svelte';

	/** @type {import('$lib/types').Project[]} */
	const projects = $page.data.projects;
</script>

<nav aria-label="breadcrumb">
	<ol class="breadcrumb">
		<li class="breadcrumb-item active" aria-current="page">Projects</li>
	</ol>
</nav>

<div class="container">
	<ProjectsList {projects} />
	<ProjectInfoModal />
</div>
