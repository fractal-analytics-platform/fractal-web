<script>
	import { env } from '$env/dynamic/public';
	import { extractJobErrorParts } from '$lib/common/job_utilities';
	import { onDestroy } from 'svelte';
	import Modal from '../../common/Modal.svelte';
	import ExpandableLog from '$lib/components/common/ExpandableLog.svelte';

	/** @type {Array<{text: string, highlight: boolean}>} */
	let logParts = [];
	let errorAlert = undefined;
	/** @type {Modal} */
	let modal;
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

	function onClose() {
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
	bodyCss="bg-tertiary text-secondary p-0 pt-2"
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
		<ExpandableLog bind:logParts highlight={job.status === 'failed'} />
		{/if}
	</svelte:fragment>
</Modal>

