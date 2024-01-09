<script>
	import { page } from '$app/stores';
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import JobsList from '$lib/components/jobs/JobsList.svelte';

	let searched = false;
	let searching = false;
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let searchErrorAlert;

	/** @type {JobsList} */
	let jobsListComponent;
	/** @type {import('$lib/types').ApplyWorkflow[]} */
	let jobs = [];

	let status;
	let userId;

	let startDateMin;
	let startTimeMin;
	let startDateMax;
	let startTimeMax;

	let endDateMin;
	let endTimeMin;
	let endDateMax;
	let endTimeMax;

	let projectId;
	let workflowId;
	let inputDatasetId;
	let outputDatasetId;

	/**
	 * @returns {Promise<import('$lib/types').ApplyWorkflow[]>}
	 */
	async function jobUpdater() {
		/** @type {import('$lib/types').ApplyWorkflow[]} */
		const jobsToCheck = jobs.filter((j) => j.status === 'running' || j.status === 'submitted');
		/** @type {import('$lib/types').ApplyWorkflow[]} */
		const updatedJobs = [];
		for (const job of jobsToCheck) {
			const url = new URL('/api/admin/job', window.location.origin);
			url.searchParams.append('id', job.id.toString());
			const response = await fetch(url);
			if (response.ok) {
				updatedJobs.push((await response.json())[0]);
			}
		}
		jobs = jobs.map((j) => {
			if (j.status === 'failed') {
				// The admin has manually updated the job status while the AJAX call was in progress
				return j;
			}
			const updatedJob = updatedJobs.find((uj) => uj.id === j.id);
			return updatedJob ?? j;
		});
		return jobs;
	}

	async function searchJobs() {
		searching = true;
		try {
			if (searchErrorAlert) {
				searchErrorAlert.hide();
			}
			const url = new URL('/api/admin/job', window.location.origin);
			if (status) {
				url.searchParams.append('status', status);
			}
			if (userId) {
				url.searchParams.append('user_id', userId);
			}
			const startTimestampMin = getTimestamp(startDateMin, startTimeMin);
			if (startTimestampMin) {
				url.searchParams.append('start_timestamp_min', startTimestampMin);
			}
			const startTimestampMax = getTimestamp(startDateMax, startTimeMax);
			if (startTimestampMax) {
				url.searchParams.append('start_timestamp_max', startTimestampMax);
			}
			const endTimestampMin = getTimestamp(endDateMin, endTimeMin);
			if (endTimestampMin) {
				url.searchParams.append('end_timestamp_min', endTimestampMin);
			}
			const endTimestampMax = getTimestamp(endDateMax, endTimeMax);
			if (endTimestampMax) {
				url.searchParams.append('end_timestamp_max', endTimestampMax);
			}
			if (projectId) {
				url.searchParams.append('project_id', projectId);
			}
			if (workflowId) {
				url.searchParams.append('workflow_id', workflowId);
			}
			if (inputDatasetId) {
				url.searchParams.append('input_dataset_id', inputDatasetId);
			}
			if (outputDatasetId) {
				url.searchParams.append('output_dataset_id', outputDatasetId);
			}
			const response = await fetch(url);
			const result = await response.json();
			if (!response.ok) {
				searchErrorAlert = displayStandardErrorAlert(result, 'searchError');
				return;
			}
			searched = true;
			jobs = result;
			jobsListComponent.setJobs(jobs);
		} finally {
			searching = false;
		}
	}

	/**
	 * @param {string|undefined} date
	 * @param {string|undefined} time
	 * @returns {string|undefined}
	 */
	function getTimestamp(date, time) {
		if (date === undefined || date === '') {
			return undefined;
		}
		if (time === undefined || time === '') {
			return `${date}T00:00:00`;
		}
		return `${date}T${time}:00`;
	}

	function resetSearchFields() {
		if (searchErrorAlert) {
			searchErrorAlert.hide();
		}
		status = '';
		userId = '';
		startDateMin = '';
		startTimeMin = '';
		startDateMax = '';
		startTimeMax = '';
		endDateMin = '';
		endTimeMin = '';
		endDateMax = '';
		endTimeMax = '';
		projectId = '';
		workflowId = '';
		inputDatasetId = '';
		outputDatasetId = '';
		searched = false;
		jobs = [];
		jobsListComponent.setJobs([]);
	}

	async function downloadCSV() {
		const header = [
			'status',
			'start_timestamp',
			'end_timestamp',
			'project_id',
			'workflow_id',
			'workflow_name',
			'input_dataset_id',
			'input_dataset_name',
			'output_dataset_id',
			'output_dataset_name',
			'user_email',
			'working_dir',
			'working_dir_user',
			'first_task_index',
			'last_task_index'
		];
		const rows = jobs.map((job) => [
			job.status,
			job.start_timestamp,
			job.end_timestamp,
			job.project_id,
			job.workflow_id,
			job.workflow_dump?.name,
			job.input_dataset_id,
			job.input_dataset_dump?.name,
			job.output_dataset_id,
			job.output_dataset_dump?.name,
			job.user_email,
			job.working_dir,
			job.working_dir_user,
			job.first_task_index,
			job.last_task_index
		]);
		const csv = arrayToCsv([header, ...rows]);
		downloadBlob(csv, 'jobs.csv', 'text/csv;charset=utf-8;');
	}

	/**
	 * @param {any[][]} data
	 */
	function arrayToCsv(data) {
		return data
			.map((row) =>
				row
					.map((v) => (v === null || v === undefined ? '' : v))
					.map(String) // convert every value to String
					.map((v) => v.replaceAll('"', '""')) // escape double quotes
					.map((v) => `"${v}"`)
					.join(',')
			)
			.join('\n');
	}

	/**
	 * @param {string} content
	 * @param {string} filename
	 * @param {string} contentType
	 */
	function downloadBlob(content, filename, contentType) {
		// Create a blob
		var blob = new Blob([content], { type: contentType });
		var url = URL.createObjectURL(blob);

		// Create a link to download it
		var downloader = document.createElement('a');
		downloader.href = url;
		downloader.setAttribute('download', filename);
		downloader.click();
	}

	/** @type {Modal} */
	let statusModal;
	/** @type {import('$lib/types').ApplyWorkflow|undefined} */
	let jobInEditing;

	/**
	 * @param {import('$lib/types').ApplyWorkflow} row
	 */
	function openEditStatusModal(row) {
		jobInEditing = row;
		statusModal.show();
	}

	let updatingStatus = false;

	async function updateJobStatus() {
		statusModal.confirmAndHide(async () => {
			updatingStatus = true;
			try {
				const jobId = /** @type {import('$lib/types').ApplyWorkflow} */ (jobInEditing).id;

				const headers = new Headers();
				headers.append('Content-Type', 'application/json');

				const response = await fetch(`/api/admin/job/${jobId}`, {
					method: 'PATCH',
					credentials: 'include',
					headers,
					body: JSON.stringify({ status: 'failed' })
				});

				if (!response.ok) {
					throw new AlertError(await response.json());
				}

				jobs = jobs.map((j) => (j.id === jobId ? { ...j, status: 'failed' } : j));
				jobsListComponent.setJobs(jobs);
			} finally {
				updatingStatus = false;
			}
		});
	}
</script>

<div>
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item">
				<a href="/admin">Admin area</a>
			</li>
			<li class="breadcrumb-item active" aria-current="page">Jobs</li>
		</ol>
	</nav>

	<div class="d-flex justify-content-between align-items-center my-3">
		<h1 class="fw-light">Jobs</h1>
	</div>

	<div class="row">
		<div class="col-lg-3">
			<div class="row mt-1">
				<label class="col-3 col-form-label" for="status">Status</label>
				<div class="col-9">
					<select class="form-control" bind:value={status} id="status">
						<option value="">All</option>
						<option value="running">Running</option>
						<option value="done">Done</option>
						<option value="failed">Failed</option>
						<option value="submitted">Submitted</option>
					</select>
				</div>
			</div>
		</div>
		<div class="col-lg-3 offset-lg-1">
			<div class="row mt-1">
				<label class="col-3 col-form-label" for="user">User</label>
				<div class="col-9">
					<select class="form-control" bind:value={userId} id="user">
						<option value="">All</option>
						{#each $page.data.users as user}
							<option value={user.id}>{user.email}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</div>

	<div class="row mt-3">
		<div class="col-md-3 col-lg-2 mt-2">Start timestamp</div>
		<div class="col-md-9 col-lg-10">
			<div class="row row-cols-md-auto">
				<div class="col-12 mt-1">
					<div class="input-group">
						<div class="input-group-text">Min</div>
						<input type="date" class="form-control" bind:value={startDateMin} id="start_date_min" />
						<input type="time" class="form-control" bind:value={startTimeMin} id="start_time_min" />
					</div>
				</div>
				<div class="col-12 mt-1">
					<div class="input-group">
						<div class="input-group-text">Max</div>
						<input type="date" class="form-control" bind:value={startDateMax} id="start_date_max" />
						<input type="time" class="form-control" bind:value={startTimeMax} id="start_time_max" />
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="row mt-2">
		<div class="col-md-3 col-lg-2 mt-2">End timestamp</div>
		<div class="col-md-9 col-lg-10">
			<div class="row row-cols-md-auto">
				<div class="col-12 mt-1">
					<div class="input-group">
						<div class="input-group-text">Min</div>
						<input type="date" class="form-control" bind:value={endDateMin} id="end_date_min" />
						<input type="time" class="form-control" bind:value={endTimeMin} id="end_time_min" />
					</div>
				</div>
				<div class="col-12 mt-1">
					<div class="input-group">
						<div class="input-group-text">Max</div>
						<input type="date" class="form-control" bind:value={endDateMax} id="end_date_max" />
						<input type="time" class="form-control" bind:value={endTimeMax} id="end_time_max" />
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="row mt-3">
		<div class="col-lg-5 col-xl-4">
			<div class="row mt-1">
				<label class="col-6 col-md-4 col-lg-6 col-form-label" for="project">Project Id</label>
				<div class="col-6">
					<input type="number" class="form-control" bind:value={projectId} id="project" />
				</div>
			</div>
		</div>

		<div class="col-lg-5 offset-lg-1 col-xl-4 offset-xl-1">
			<div class="row mt-1">
				<label class="col-6 col-md-4 col-lg-6 col-form-label" for="workflow">Workflow Id</label>
				<div class="col-6">
					<input type="number" class="form-control" bind:value={workflowId} id="workflow" />
				</div>
			</div>
		</div>
	</div>

	<div class="row mt-3">
		<div class="col-lg-5 col-xl-4">
			<div class="row mt-1">
				<label class="col-6 col-md-4 col-lg-6 col-form-label" for="input_dataset"
					>Input dataset Id</label
				>
				<div class="col-6">
					<input
						type="number"
						class="form-control"
						bind:value={inputDatasetId}
						id="input_dataset"
					/>
				</div>
			</div>
		</div>

		<div class="col-lg-5 offset-lg-1 col-xl-4 offset-xl-1">
			<div class="row mt-1">
				<label class="col-6 col-md-4 col-lg-6 col-form-label" for="output_dataset"
					>Output dataset Id</label
				>
				<div class="col-6">
					<input
						type="number"
						class="form-control"
						bind:value={outputDatasetId}
						id="output_dataset"
					/>
				</div>
			</div>
		</div>
	</div>

	<button class="btn btn-primary mt-4" on:click={searchJobs} disabled={searching}>
		{#if searching}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
		{:else}
			<i class="bi bi-search" />
		{/if}
		Search jobs
	</button>
	<button class="btn btn-warning mt-4" on:click={resetSearchFields} disabled={searching}>
		Reset
	</button>

	<div id="searchError" class="mt-3" />

	<div class:d-none={!searched}>
		<p class="text-center">
			The query returned {jobs.length} matching {jobs.length !== 1 ? 'jobs' : 'job'}
		</p>
		<JobsList {jobUpdater} bind:this={jobsListComponent} admin={true}>
			<svelte:fragment slot="buttons">
				<button class="btn btn-outline-secondary" on:click={downloadCSV}>
					<i class="bi-download" /> Download CSV
				</button>
			</svelte:fragment>
			<svelte:fragment slot="edit-status" let:row>
				{#if row.status === 'submitted' || row.status === 'running'}
					&nbsp;
					<button class="btn btn-link p-0" on:click={() => openEditStatusModal(row)}>
						<i class="bi bi-pencil" />
					</button>
				{/if}
			</svelte:fragment>
		</JobsList>
	</div>
</div>

<Modal id="editJobStatusModal" bind:this={statusModal} centered={true} size="md">
	<svelte:fragment slot="header">
		{#if jobInEditing}
			<h1 class="h5 modal-title flex-grow-1">Editing job #{jobInEditing.id}</h1>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-editJobStatusModal" />
		<div class="alert alert-warning">
			<i class="bi bi-exclamation-triangle" />
			<strong>Warning</strong>: this operation will not cancel job execution but only modify its
			status in the database
		</div>
		<div class="d-flex justify-content-center">
			<button class="btn btn-danger" on:click={updateJobStatus} disabled={updatingStatus}>
				Set status to failed
			</button>
			&nbsp;
			<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		</div>
	</svelte:fragment>
</Modal>

<style>
	input[type='date'] {
		min-width: 190px;
	}
</style>
