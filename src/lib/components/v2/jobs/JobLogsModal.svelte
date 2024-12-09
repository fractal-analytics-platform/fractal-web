<script>
	import { env } from '$env/dynamic/public';
	import { extractJobErrorParts } from '$lib/common/job_utilities';
	import { onDestroy } from 'svelte';
	import Modal from '../../common/Modal.svelte';

	/** @type {Array<{text: string, highlight: boolean}>} */
	let logParts = [];
	let errorAlert = undefined;
	/** @type {Modal} */
	let modal;
	/** Show/hide complete stack trace */
	let showDetails = false;
	/** @type {import('fractal-components/types/api').ApplyWorkflowV2} */
	let job;
	let admin = false;
	let log = '';
	let loading = true;

	const updateJobInterval = env.PUBLIC_UPDATE_JOBS_INTERVAL
		? parseInt(env.PUBLIC_UPDATE_JOBS_INTERVAL)
		: 3000;
	/** @type {NodeJS.Timeout|undefined} */
	let updateJobTimeout = undefined;

	/**
	 * @param {import('fractal-components/types/api').ApplyWorkflowV2} selectedJob
	 * @param {boolean} isAdminPage
	 */
	export async function show(selectedJob, isAdminPage) {
		// remove previous error
		if (errorAlert) {
			errorAlert.hide();
		}
		job = selectedJob;
		admin = isAdminPage;
		log = '';
		loading = true;
		modal.show();
		try {
			await loadJobLog();
			if (job.status === 'failed') {
				logParts = extractJobErrorParts(log, true);
			} else {
				logParts = [{ text: log, highlight: false }];
				if (job.status === 'submitted') {
					updateJobTimeout = setTimeout(updateJobLogInBackground, updateJobInterval);
				}
			}
		} finally {
			loading = false;
		}
	}

	async function updateJobLogInBackground() {
		clearTimeout(updateJobTimeout);
		if (job.status === 'submitted') {
			await loadJobLog();
			logParts = [{ text: log, highlight: false }];
			updateJobTimeout = setTimeout(updateJobLogInBackground, updateJobInterval);
		} else if (job.status === 'failed') {
			logParts = extractJobErrorParts(log, true);
		} else {
			logParts = [{ text: log, highlight: false }];
		}
	}

	async function loadJobLog() {
		if (admin) {
			await loadAdminJobLog();
		} else {
			await loadUserJobLog();
		}
	}

	async function loadAdminJobLog() {
		const response = await fetch(`/api/admin/v2/job/${job.id}?show_tmp_logs=true`);
		if (response.ok) {
			const result = await response.json();
			log = result.log || '';
			job.status = result.status;
		} else {
			modal.displayErrorAlert('Unable to fetch job');
		}
	}

	async function loadUserJobLog() {
		const response = await fetch(
			`/api/v2/project/${job.project_id}/job/${job.id}?show_tmp_logs=true`
		);
		if (response.ok) {
			const result = await response.json();
			log = result.log || '';
			job.status = result.status;
		} else {
			modal.displayErrorAlert('Unable to fetch job');
		}
	}

	function expandDetails() {
		showDetails = true;
		// Restore focus on modal, otherwise it will not be possible to close it using the esc key
		const modal = document.querySelector('.modal.show');
		if (modal instanceof HTMLElement) {
			modal.focus();
		}
	}

	function onClose() {
		showDetails = false;
		clearTimeout(updateJobTimeout);
	}

	onDestroy(() => {
		clearTimeout(updateJobTimeout);
	});
</script>

<Modal
	id="workflowJobLogsModal"
	fullscreen={true}
	bind:this={modal}
	bodyCss="bg-tertiary text-secondary"
	{onClose}
>
	<svelte:fragment slot="header">
		<div class="flex-fill">
			<h1 class="h5 modal-title float-start mt-1">Workflow Job logs</h1>
		</div>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-workflowJobLogsModal" />
		{#if loading}
			<div class="spinner-border spinner-border-sm" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
			Loading...
		{:else}
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
					<pre class:highlight={job.status === 'failed'}>{logParts
							.map((p) => p.text)
							.join('\n')}</pre>
				{/if}
			</div>
		{/if}
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
