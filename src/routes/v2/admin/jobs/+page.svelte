<script>
	import { page } from '$app/state';
	import { arrayToCsv, downloadBlob, getTimestamp } from '$lib/common/component_utilities';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import { sortUsers } from '$lib/components/admin/user_utilities';
	import Modal from '$lib/components/common/Modal.svelte';
	import Paginator from '$lib/components/common/Paginator.svelte';
	import JobsList from '$lib/components/v2/jobs/JobsList.svelte';
	import { normalizePayload } from 'fractal-components';
	import { onMount } from 'svelte';

	const currentUserId = $derived(page.data.userInfo.id);
	const users = $derived(sortDropdownUsers(page.data.users));

	let searched = $state(false);
	let searching = $state(false);
	let processingCsv = $state(false);
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let searchErrorAlert;

	/** @type {JobsList|undefined} */
	let jobsListComponent = $state();
	/** @type {import('fractal-components/types/api').Pagination<import('fractal-components/types/api').ApplyWorkflowV2> | undefined} */
	let jobs = $state();
	let currentPage = $state(1);
	let pageSize = $state(50);
	let totalCount = $state(0);

	let status = $state();
	let userId = $state();
	let jobId = $state();

	let startDateMin = $state();
	let startTimeMin = $state();
	let startDateMax = $state();
	let startTimeMax = $state();

	let endDateMin = $state();
	let endTimeMin = $state();
	let endDateMax = $state();
	let endTimeMax = $state();

	let projectId = $state();
	let workflowId = $state();
	let datasetId = $state();
	let resourceId = $state();

	/** @type {import('fractal-components/types/api').Resource[]} */
	let resources = $state([]);

	/**
	 * @returns {Promise<import('fractal-components/types/api').ApplyWorkflowV2[]>}
	 */
	async function jobUpdater() {
		if (!jobs) {
			return [];
		}

		/** @type {import('fractal-components/types/api').ApplyWorkflowV2[]} */
		const jobsToCheck = jobs.items.filter((j) => j.status === 'submitted');
		/** @type {import('fractal-components/types/api').ApplyWorkflowV2[]} */
		const updatedJobs = [];
		for (const job of jobsToCheck) {
			const url = new URL('/api/admin/v2/job', window.location.origin);
			url.searchParams.append('log', 'false');
			url.searchParams.append('id', job.id.toString());
			const response = await fetch(url);
			if (response.ok) {
				const { items } = await response.json();
				updatedJobs.push(items[0]);
			}
		}
		jobs.items = jobs.items.map((j) => {
			if (j.status === 'failed') {
				// The admin has manually updated the job status while the AJAX call was in progress
				return j;
			}
			const updatedJob = updatedJobs.find((uj) => uj.id === j.id);
			return updatedJob ?? j;
		});
		return jobs.items;
	}

	/**
	 * @param {number} selectedPage
	 * @param {number} selectedPageSize
	 */
	async function searchJobs(selectedPage, selectedPageSize) {
		searching = true;
		try {
			if (searchErrorAlert) {
				searchErrorAlert.hide();
			}
			const url = getBaseJobsSearchUrl();
			url.searchParams.append('page', selectedPage.toString());
			url.searchParams.append('page_size', selectedPageSize.toString());
			const response = await fetch(url);
			if (!response.ok) {
				searchErrorAlert = displayStandardErrorAlert(
					await getAlertErrorFromResponse(response),
					'searchError'
				);
				return;
			}
			searched = true;
			jobs = await response.json();
			if (jobs) {
				currentPage = jobs.current_page;
				pageSize = jobs.page_size;
				totalCount = jobs.total_count;
				jobsListComponent?.setJobs(jobs.items);
			}
		} finally {
			searching = false;
		}
	}

	function getBaseJobsSearchUrl() {
		const url = new URL('/api/admin/v2/job', window.location.origin);
		url.searchParams.append('log', 'false');
		if (status) {
			url.searchParams.append('status', status);
		}
		if (userId) {
			url.searchParams.append('user_id', userId);
		}
		if (jobId) {
			url.searchParams.append('id', jobId);
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
		if (datasetId) {
			url.searchParams.append('dataset_id', datasetId);
		}
		if (resourceId) {
			url.searchParams.append('resource_id', resourceId);
		}
		return url;
	}

	function resetSearchFields() {
		if (searchErrorAlert) {
			searchErrorAlert.hide();
		}
		status = '';
		userId = '';
		jobId = '';
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
		datasetId = '';
		resourceId = '';
		searched = false;
		jobs = undefined;
		currentPage = 1;
		pageSize = 50;
		totalCount = 0;
		jobsListComponent?.setJobs([]);
	}

	async function downloadCSV() {
		if (!jobs) {
			return;
		}

		processingCsv = true;

		const header = [
			'id',
			'status',
			'start_timestamp',
			'end_timestamp',
			'project_id',
			'workflow_id',
			'workflow_name',
			'dataset_id',
			'dataset_name',
			'user_email',
			'working_dir',
			'working_dir_user',
			'first_task_index',
			'last_task_index'
		];

		const url = getBaseJobsSearchUrl();
		const response = await fetch(url);
		if (!response.ok) {
			searchErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'searchError'
			);
			processingCsv = false;
			return;
		}

		const { items } =
			/** @type {import('fractal-components/types/api').Pagination<import('fractal-components/types/api').ApplyWorkflowV2>} */ (
				await response.json()
			);

		const rows = items.map((job) => [
			job.id,
			job.status,
			job.start_timestamp,
			job.end_timestamp,
			job.project_id,
			job.workflow_id,
			job.workflow_dump.name,
			job.dataset_id,
			job.dataset_dump.name,
			job.user_email,
			job.working_dir,
			job.working_dir_user,
			job.first_task_index,
			job.last_task_index
		]);

		const csv = arrayToCsv([header, ...rows]);
		downloadBlob(csv, 'jobs.csv', 'text/csv;charset=utf-8;');

		processingCsv = false;
	}

	/** @type {Modal|undefined} */
	let statusModal = $state();
	/** @type {import('fractal-components/types/api').ApplyWorkflowV2|undefined} */
	let jobInEditing = $state();

	/**
	 * @param {import('fractal-components/types/api').ApplyWorkflowV2} row
	 */
	function openEditStatusModal(row) {
		jobInEditing = row;
		statusModal?.show();
	}

	let updatingStatus = $state(false);

	async function updateJobStatus() {
		statusModal?.confirmAndHide(
			async () => {
				if (!jobs) {
					return;
				}

				updatingStatus = true;
				const jobId = /** @type {import('fractal-components/types/api').ApplyWorkflowV2} */ (
					jobInEditing
				).id;

				const headers = new Headers();
				headers.append('Content-Type', 'application/json');

				const response = await fetch(`/api/admin/v2/job/${jobId}`, {
					method: 'PATCH',
					credentials: 'include',
					headers,
					body: normalizePayload({ status: 'failed' })
				});

				if (!response.ok) {
					throw await getAlertErrorFromResponse(response);
				}

				jobs.items = jobs.items.map((j) => (j.id === jobId ? { ...j, status: 'failed' } : j));
				jobsListComponent?.setJobs(jobs.items);
			},
			() => {
				updatingStatus = false;
			}
		);
	}

	/**
	 * @param {import('fractal-components/types/api').User[]} users
	 */
	function sortDropdownUsers(users) {
		const usersCopy =
			/** @type {Array<import('fractal-components/types/api').User & {id: number}>} */ ([...users]);
		sortUsers(usersCopy, currentUserId, false);
		return usersCopy;
	}

	onMount(async () => {
		const response = await fetch(`/api/admin/v2/resource`, {
			method: 'GET',
			credentials: 'include'
		});
		if (response.ok) {
			resources = await response.json();
		}
	});
</script>

<div class="container mt-3">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h1 class="fw-light">Jobs</h1>
	</div>

	<div class="row">
		<div class="col-lg-3">
			<div class="row mt-1">
				<label class="col-3 col-form-label" for="status">Status</label>
				<div class="col-9">
					<select class="form-select" bind:value={status} id="status">
						<option value="">All</option>
						<option value="submitted">Submitted</option>
						<option value="done">Done</option>
						<option value="failed">Failed</option>
					</select>
				</div>
			</div>
		</div>
		<div class="col-lg-3 offset-lg-1">
			<div class="row mt-1">
				<label class="col-3 col-form-label" for="user">User</label>
				<div class="col-9">
					<select class="form-select" bind:value={userId} id="user">
						<option value="">All</option>
						{#each users as user (user.id)}
							<option value={user.id}>{user.email}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
		<div class="col-lg-3 offset-lg-1">
			<div class="row mt-1">
				<label class="col-3 col-form-label" for="job_id">Job Id</label>
				<div class="col-9">
					<input type="number" id="job_id" class="form-control" bind:value={jobId} />
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
				<label class="col-6 col-md-4 col-lg-6 col-form-label" for="dataset"> Dataset Id </label>
				<div class="col-6">
					<input type="number" class="form-control" bind:value={datasetId} id="dataset" />
				</div>
			</div>
		</div>
		<div class="col-lg-5 offset-lg-1 col-xl-4 offset-xl-1">
			<div class="row mt-1">
				<label class="col-6 col-md-4 col-lg-6 col-form-label" for="resource"> Resource Id </label>
				<div class="col-6">
					<select class="form-select" bind:value={resourceId} id="resource">
						<option value="">All</option>
						{#each resources as resource (resource.id)}
							<option value={resource.id}>{resource.name}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</div>

	<button class="btn btn-primary mt-4" onclick={() => searchJobs(1, pageSize)} disabled={searching}>
		{#if searching}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
		{:else}
			<i class="bi bi-search"></i>
		{/if}
		Search jobs
	</button>
	<button class="btn btn-warning mt-4" onclick={resetSearchFields} disabled={searching}>
		Reset
	</button>

	<div id="searchError" class="mt-3"></div>

	<div class:d-none={!searched}>
		{#if jobs && jobs.total_count === 0}
			<p class="text-center">The query returned 0 matching jobs</p>
		{/if}
		<JobsList {jobUpdater} bind:this={jobsListComponent} admin={true}>
			{#snippet buttons()}
				<button class="btn btn-outline-secondary" onclick={downloadCSV} disabled={processingCsv}>
					{#if processingCsv}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
					{:else}
						<i class="bi-download"></i>
					{/if}
					Download CSV
				</button>
			{/snippet}
			{#snippet editStatus(row)}
				{#if row.status === 'submitted'}
					&nbsp;
					<button
						class="btn btn-link p-0"
						onclick={() => openEditStatusModal(row)}
						aria-label="Edit status"
					>
						<i class="bi bi-pencil"></i>
					</button>
				{/if}
			{/snippet}
		</JobsList>

		{#if jobs && jobs.total_count > 0}
			<Paginator
				{currentPage}
				{pageSize}
				{totalCount}
				singleLine={true}
				onPageChange={(currentPage, pageSize) => searchJobs(currentPage, pageSize)}
			/>
		{/if}
	</div>
</div>

<Modal id="editJobStatusModal" bind:this={statusModal} centered={true} size="md">
	{#snippet header()}
		{#if jobInEditing}
			<h1 class="h5 modal-title flex-grow-1">Editing job #{jobInEditing.id}</h1>
		{/if}
	{/snippet}
	{#snippet body()}
		<div id="errorAlert-editJobStatusModal"></div>
		<div class="alert alert-warning">
			<i class="bi bi-exclamation-triangle"></i>
			<strong>Warning</strong>: this operation will not cancel job execution but only modify its
			status in the database
		</div>
		<div class="d-flex justify-content-center">
			<button class="btn btn-danger" onclick={updateJobStatus} disabled={updatingStatus}>
				{#if updatingStatus}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
				{/if}
				Set status to failed
			</button>
			&nbsp;
			<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		</div>
	{/snippet}
</Modal>

<style>
	input[type='date'] {
		min-width: 190px;
	}
</style>
