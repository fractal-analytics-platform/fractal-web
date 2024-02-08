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

	/**
	 * @param logs {string|null}
	 */
	export async function show(logs) {
		// remove previous error
		if (errorAlert) {
			errorAlert.hide();
		}
		logParts = extractJobErrorParts(logs);
		modal.show();
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
			<button
				class="btn btn-secondary float-end me-3"
				on:click={() => (showDetails = !showDetails)}
			>
				{#if showDetails}
					Hide details
				{:else}
					Show details
				{/if}
			</button>
		</div>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="workflowJobLogsError" />
		<div class="row" id="workflow-job-logs">
			<!-- IMPORTANT: do not reindent the pre block, as it will affect the aspect of the log message -->
			{#if showDetails}
				<pre class="ps-0 pe-0">
<!-- -->{#each logParts as part}<div class:highlight={part.highlight} class="ps-3 pe-3">{part.text}
<!-- --></div>{/each}</pre>
			{:else}
				<pre class="fw-bold">{logParts
						.filter((p) => p.highlight)
						.map((p) => p.text)
						.join('\n')}</pre>
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
</style>
