<script>
	import JobsList from '$lib/components/jobs/JobsList.svelte';
	import { AlertError } from '$lib/common/errors';
	import { page } from '$app/stores';

	/**
	 * @returns {Promise<import('$lib/types').ApplyWorkflow[]>}
	 */
	async function jobUpdater() {
		const response = await fetch(`/api/${$page.data.apiVersion}/job?log=false`, {
			method: 'GET',
			credentials: 'include',
			mode: 'cors'
		});
		const result = await response.json();
		if (!response.ok) {
			throw new AlertError(result);
		}
		return result;
	}
</script>

<JobsList {jobUpdater} columnsToHide={['user_email', 'id']} />
