<script>
	import { page } from '$app/stores';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import Modal from '../common/Modal.svelte';

	let workflowJobId = undefined;
	let logs = '';
	let errorAlert = undefined;
	/** @type {Modal} */
	let modal;

	export async function show(jobId) {
		workflowJobId = jobId;

		// remove previous error
		if (errorAlert) {
			errorAlert.hide();
		}

		const job = await fetchJob();
		logs = job?.log || '';

		modal.show();
	}

	async function fetchJob() {
		const request = await fetch(`/api/v1/project/${$page.params.projectId}/job/${workflowJobId}`, {
			method: 'GET',
			credentials: 'include'
		});

		const result = await request.json();
		if (request.ok) {
			return result;
		} else {
			console.error('Failed to fetch job', result);
			errorAlert = displayStandardErrorAlert(result, 'workflowJobLogsError');
		}
	}
</script>

<Modal
	id="workflowJobLogsModal"
	fullscreen={true}
	bind:this={modal}
	bodyCss="bg-tertiary text-secondary"
>
	<svelte:fragment slot="header">
		<h1 class="h5 modal-title">Workflow Job logs</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="workflowJobLogsError" />
		<pre>{logs}</pre>
	</svelte:fragment>
</Modal>
