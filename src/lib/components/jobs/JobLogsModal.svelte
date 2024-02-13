<script>
	import { extractJobErrorParts } from '$lib/common/job_utilities';
	import Modal from '../common/Modal.svelte';

	/** @type {Array<{text: string, highlight: boolean}>} */
	let logParts = [];
	let errorAlert = undefined;
	/** @type {Modal} */
	let modal;
	/** Show/hide complete stack trace */
	let showDetails = false;
	/** @type {import('$lib/types').JobStatus} */
	let jobStatus;

	/**
	 * @param {import('$lib/types').ApplyWorkflow} job
	 */
	export async function show(job) {
		// remove previous error
		if (errorAlert) {
			errorAlert.hide();
		}
		jobStatus = job.status;
		if (job.status === 'failed') {
			logParts = extractJobErrorParts(job.log, true);
		} else {
			logParts = [{ text: job.log || '', highlight: false }];
		}
		modal.show();
	}

	function expandDetails() {
		showDetails = true;
		// Restore focus on modal, otherwise it will not be possible to close it using the esc key
		const modal = document.querySelector('.modal.show');
		if (modal instanceof HTMLElement) {
			modal.focus();
		}
	}
</script>

<Modal
	id="workflowJobLogsModal"
	fullscreen={true}
	bind:this={modal}
	bodyCss="bg-tertiary text-secondary"
	onClose={() => (showDetails = false)}
>
	<svelte:fragment slot="header">
		<div class="flex-fill">
			<h1 class="h5 modal-title float-start mt-1">Workflow Job logs</h1>
		</div>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="workflowJobLogsError" />
		<div class="row" id="workflow-job-logs">
			<!-- IMPORTANT: do not reindent the pre block, as it will affect the aspect of the log message -->
			{#if logParts.length > 1}
				<pre class="ps-0 pe-0">
<!-- -->{#each logParts as part}{#if part.highlight}<div class="ps-3 pe-3 highlight">{part.text}
<!-- --></div>{:else if showDetails}<div class="ps-3 pe-3">{part.text}</div>{:else}<button
								class="btn btn-link text-decoration-none details-btn"
								on:click={expandDetails}>... (details hidden, click here to expand)</button
							>{/if}{/each}</pre>
			{:else}
				<pre class:highlight={jobStatus === 'failed'}>{logParts.map((p) => p.text).join('\n')}</pre>
			{/if}
		</div>
	</svelte:fragment>
</Modal>

<style>
	#workflow-job-logs pre {
		/** avoid issues with overflow of inner divs */
		display: table;
	}
	.highlight {
		font-weight: bold;
		background-color: #ffe5e5;
	}

	.details-btn {
		font-family: revert;
	}
</style>
