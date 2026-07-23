<script>
	import JobsList from '$lib/components/v2/jobs/JobsList.svelte';
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import { page } from '$app/state';

	/**
	 * @returns {Promise<import('fractal-components/types/api').JobV2[]>}
	 */
	async function jobUpdater() {
		const response = await fetch(`/api/v2/job?log=false`);
		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}
		return await response.json();
	}
</script>

<div class="container mt-3">
	<JobsList {jobUpdater} columnsToHide={['id']} runnerBackend={page.data.runnerBackend} />
</div>
