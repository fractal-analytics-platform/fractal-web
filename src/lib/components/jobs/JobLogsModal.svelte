<script>
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import { extractJobErrorParts } from '$lib/common/job_utilities';
	import Modal from '../common/Modal.svelte';

	/** @type {Array<{text: string, highlight: boolean}>} */
	let logParts = [];
	let errorAlert = undefined;
	/** @type {Modal} */
	let modal;

	/**
	 * @param prjId {number}
	 * @param jobId {number}
	 * @param log {string|null=}
	 */
	export async function show(prjId, jobId, log) {
		// remove previous error
		if (errorAlert) {
			errorAlert.hide();
		}

		let logs;
		if (log) {
			logs = log;
		} else {
			const job = await fetchJob(prjId, jobId);
			logs = job?.log || '';
		}
		logParts = extractJobErrorParts(logs);

		modal.show();
	}

	/**
	 * @param projectId {number}
	 * @param workflowJobId {number}
	 */
	async function fetchJob(projectId, workflowJobId) {
		const request = await fetch(`/api/v1/project/${projectId}/job/${workflowJobId}`, {
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
		<div class="row">
			<!-- IMPORTANT: do not reindent the pre block, as it will affect the aspect of the log message -->
			<pre class="ps-0 pe-0" id="workflow-job-logs">
<!-- -->{#each logParts as part}<div class:highlight={part.highlight} class="ps-3 pe-3">{part.text}
<!-- --></div>{/each}</pre>
		</div>
	</svelte:fragment>
</Modal>

<style>
	#workflow-job-logs {
		/** avoid issues with overflow of inner divs */
		display: table;
	}
	.highlight {
		font-weight: bold;
		background-color: #ffe5e5;
	}
</style>
