<script>
	import JobsList from '$lib/components/jobs/JobsList.svelte';
	import { page } from '$app/stores';
	import { AlertError } from '$lib/common/errors';

	/** @type {import('$lib/types').Project[]} */
	let projects = $page.data.projects;

	/**
	 * @returns {Promise<import('$lib/types').ApplyWorkflow[]>}
	 */
	async function jobUpdater() {
		let jobs = [];
		for (const project of projects) {
			const response = await fetch(`/api/v1/project/${project.id}/job`, {
				method: 'GET',
				credentials: 'include',
				mode: 'cors'
			});
			const result = await response.json();
			if (!response.ok) {
				throw new AlertError(result);
			}
			jobs = jobs.concat(result);
		}
		return jobs;
	}
</script>

<div class="container">
	<div class="d-flex justify-content-between align-items-center my-3">
		<h1>Jobs of user "{$page.data.userInfo.email}"</h1>
	</div>
	<JobsList {jobUpdater} />
</div>
