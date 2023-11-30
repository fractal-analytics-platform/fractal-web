<script>
	import { page } from '$app/stores';
	import { displayStandardErrorAlert } from '$lib/common/errors';
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
			const url = new URL('/admin/job', window.location.origin);
			url.searchParams.append('id', job.id.toString());
			const response = await fetch(url);
			if (response.ok) {
				updatedJobs.push((await response.json())[0]);
			}
		}
		jobs = jobs.map((j) => {
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
			const url = new URL('/admin/job', window.location.origin);
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
			'user_email'
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
			job.user_email
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
</script>

<div class="container">
	<div class="d-flex justify-content-between align-items-center my-3">
		<h1>Jobs</h1>
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
						<input type="date" class="form-control" bind:value={startDateMin} />
						<input type="time" class="form-control" bind:value={startTimeMin} />
					</div>
				</div>
				<div class="col-12 mt-1">
					<div class="input-group">
						<div class="input-group-text">Max</div>
						<input type="date" class="form-control" bind:value={startDateMax} />
						<input type="time" class="form-control" bind:value={startTimeMax} />
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
						<input type="date" class="form-control" bind:value={endDateMin} />
						<input type="time" class="form-control" bind:value={endTimeMin} />
					</div>
				</div>
				<div class="col-12 mt-1">
					<div class="input-group">
						<div class="input-group-text">Max</div>
						<input type="date" class="form-control" bind:value={endDateMax} />
						<input type="time" class="form-control" bind:value={endTimeMax} />
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
		<JobsList {jobUpdater} bind:this={jobsListComponent} showFilters={false}>
			<svelte:fragment slot="buttons">
				<button class="btn btn-outline-secondary" on:click={downloadCSV}>
					<i class="bi-download" /> Download CSV
				</button>
			</svelte:fragment>
		</JobsList>
	</div>
</div>

<style>
	input[type='date'] {
		min-width: 190px;
	}
</style>
