<script>
	import JobsList from '$lib/components/v2/jobs/JobsList.svelte';
	import { getAlertErrorFromResponse } from '$lib/common/errors';

	/**
	 * @returns {Promise<import('$lib/types-v2').ApplyWorkflowV2[]>}
	 */
	async function jobUpdater() {
		const response = await fetch(`/api/v2/job?log=false`, {
			method: 'GET',
			credentials: 'include',
			mode: 'cors'
		});
		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}
		return await response.json();
	}
</script>

<JobsList {jobUpdater} columnsToHide={['user_email', 'id']} />
