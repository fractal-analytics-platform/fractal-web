<script>
	import JobsList from '$lib/components/jobs/JobsList.svelte';
	import { page } from '$app/stores';
	import { AlertError } from '$lib/common/errors';

	/**
	 * @returns {Promise<import('$lib/types').ApplyWorkflow[]>}
	 */
	async function jobUpdater() {
		const response = await fetch(`/api/v1/project/job`, {
			method: 'GET',
			credentials: 'include',
			mode: 'cors',
			headers: { 'x-fractal-slash': 'true' }
		});
		const result = await response.json();
		if (!response.ok) {
			throw new AlertError(result);
		}
		return result;
	}
</script>

<div class="container">
	<div class="d-flex justify-content-between align-items-center my-3">
		<h1>Jobs of user "{$page.data.userInfo.email}"</h1>
	</div>
	<JobsList {jobUpdater} />
</div>
