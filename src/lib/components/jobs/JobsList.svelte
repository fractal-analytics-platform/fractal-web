<script>
	import { env } from '$env/dynamic/public';
	import { page } from '$app/stores';
	import { DataHandler, check } from '@vincjo/datatables';
	import StatusBadge from '$lib/components/jobs/StatusBadge.svelte';
	import JobInfoModal from '$lib/components/jobs/JobInfoModal.svelte';
	import JobLogsModal from '$lib/components/jobs/JobLogsModal.svelte';
	import Th from '$lib/components/common/filterable/Th.svelte';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import { onDestroy, onMount } from 'svelte';

	/** @type {() => Promise<import('$lib/types').ApplyWorkflow[]>} */
	export let jobUpdater;
	/** @type {string[]} */
	export let columnsToHide = [];

	/** @type {JobInfoModal} */
	let jobInfoModal;
	/** @type {JobLogsModal} */
	let jobLogsModal;

	/** @type {import('$lib/types').Project[]} */
	let projects = $page.data.projects;
	/** @type {{id: number, name: string}[]} */
	let workflows = $page.data.workflows || [];
	/** @type {import('$lib/types').ApplyWorkflow[]} */
	let jobs = $page.data.jobs || [];
	/** @type {{ id: number, name: string }[]} */
	let inputDatasets = $page.data.inputDatasets || [];
	/** @type {{ id: number, name: string }[]} */
	let outputDatasets = $page.data.outputDatasets || [];
	/** @type {{ id: number, name: string }[]} */
	let datasets = inputDatasets.concat(outputDatasets);

	/** @type {DataHandler} */
	let tableHandler = new DataHandler(jobs);
	tableHandler.sortDesc('id');

	/** @type {import('svelte/types/runtime/store').Readable<import('$lib/types').ApplyWorkflow[]>} */
	let rows = tableHandler.getRows();

	// Filters
	let projectFilter = '';
	let workflowFilter = '';
	let inputDatasetFilter = '';
	let outputDatasetFilter = '';
	let statusFilter = '';

	// Filters
	$: tableHandler.filter(projectFilter, 'project_id', check.isEqualTo);
	$: tableHandler.filter(workflowFilter, 'workflow_id', check.isEqualTo);
	$: tableHandler.filter(inputDatasetFilter, 'input_dataset_id', check.isEqualTo);
	$: tableHandler.filter(outputDatasetFilter, 'output_dataset_id', check.isEqualTo);
	$: tableHandler.filter(statusFilter, 'status');

	let reloading = false;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	async function refresh() {
		if (errorAlert) {
			errorAlert.hide();
		}
		reloading = true;
		try {
			jobs = await jobUpdater();
			tableHandler.setRows(jobs);
		} catch (err) {
			errorAlert = displayStandardErrorAlert(err, 'jobUpdatesError');
		} finally {
			reloading = false;
		}
	}

	/**
	 * Requests the server to stop a job execution
	 * @param {import('$lib/types').ApplyWorkflow} job
	 * @returns {Promise<void>}
	 */
	async function handleJobCancel(job) {
		if (errorAlert) {
			errorAlert.hide();
		}

		console.log('Stop running job');
		const response = await fetch(`/api/v1/project/${job.project_id}/job/${job.id}/stop`, {
			method: 'GET',
			credentials: 'include'
		});

		if (response.ok) {
			// Refresh page
			window.location.reload();
		} else {
			console.error('Error stopping job');
			const errorResponse = await response.json();
			errorAlert = displayStandardErrorAlert(errorResponse, 'jobUpdatesError');
		}
	}

	/**
	 * @param projectId {number}
	 */
	function getProjectName(projectId) {
		const filteredProjects = projects.filter((p) => p.id === projectId);
		if (filteredProjects.length === 1) {
			return filteredProjects[0].name;
		}
		return '';
	}

	const updateJobsInterval = env.PUBLIC_UPDATE_JOBS_INTERVAL
		? parseInt(env.PUBLIC_UPDATE_JOBS_INTERVAL)
		: 3000;
	let updateJobsTimeout = null;

	async function updateJobsInBackground() {
		const jobsToCheck = jobs.filter((j) => j.status === 'running' || j.status === 'submitted');
		if (jobsToCheck.length > 0) {
			jobs = await jobUpdater();
			tableHandler.setRows(jobs);
		}
		updateJobsTimeout = setTimeout(updateJobsInBackground, updateJobsInterval);
	}

	onMount(() => {
		updateJobsTimeout = setTimeout(updateJobsInBackground, updateJobsInterval);
	});

	onDestroy(() => {
		if (updateJobsTimeout) {
			clearTimeout(updateJobsTimeout);
		}
	});
</script>

{#if tableHandler}
	<div class="d-flex justify-content-end align-items-center my-3">
		<div>
			<button
				class="btn btn-warning"
				on:click={() => {
					tableHandler.clearFilters();
					workflowFilter = '';
					inputDatasetFilter = '';
					outputDatasetFilter = '';
					statusFilter = '';
				}}
			>
				<i class="bi-x-square" />
				Clear filters
			</button>
			<button class="btn btn-primary" on:click={refresh} disabled={reloading}>
				{#if reloading}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
				{/if}
				<i class="bi-arrow-clockwise" /> Refresh
			</button>
		</div>
	</div>
	<div id="jobUpdatesError" />
	<table class="table jobs-table">
		<colgroup>
			<col id="id-column" />
		</colgroup>
		<thead class="table-light text-nowrap">
			<tr>
				<Th handler={tableHandler} key="id" label="Id" />
				<Th handler={tableHandler} key="start_timestamp" label="Start" />
				<Th handler={tableHandler} key="end_timestamp" label="End" />
				{#if !columnsToHide.includes('project')}
					<Th handler={tableHandler} key="project_id" label="Project" />
				{/if}
				{#if !columnsToHide.includes('workflow')}
					<Th handler={tableHandler} key="workflow_id" label="Workflow" />
				{/if}
				<Th handler={tableHandler} key="input_dataset_id" label="Input dataset" />
				<Th handler={tableHandler} key="output_dataset_id" label="Output dataset" />
				<Th handler={tableHandler} key="status" label="Status" />
				<th>Options</th>
			</tr>
			<tr>
				<th />
				<th />
				<th />
				{#if !columnsToHide.includes('project')}
					<th>
						{#if projects}
							<select class="form-control" bind:value={projectFilter}>
								<option value="">All</option>
								{#each projects as project}
									<option value={project.id}>{project.name}</option>
								{/each}
							</select>
						{/if}
					</th>
				{/if}
				{#if !columnsToHide.includes('workflow')}
					<th>
						{#if workflows}
							<select class="form-control" bind:value={workflowFilter}>
								<option value="">All</option>
								{#each workflows as workflow}
									<option value={workflow.id}>{workflow.name}</option>
								{/each}
							</select>
						{/if}
					</th>
				{/if}
				<th>
					{#key inputDatasetFilter}
						<select class="form-control" bind:value={inputDatasetFilter}>
							<option value="">All</option>
							{#each inputDatasets as dataset}
								<option value={dataset.id}>{dataset.name}</option>
							{/each}
						</select>
					{/key}
				</th>
				<th>
					<select class="form-control" bind:value={outputDatasetFilter}>
						<option value="">All</option>
						{#each outputDatasets as dataset}
							<option value={dataset.id}>{dataset.name}</option>
						{/each}
					</select>
				</th>
				<th>
					<select class="form-control" bind:value={statusFilter}>
						<option value="">All</option>
						<option value="running">Running</option>
						<option value="done">Done</option>
						<option value="failed">Failed</option>
						<option value="submitted">Submitted</option>
					</select>
				</th>
				<th />
			</tr>
		</thead>

		<tbody>
			{#if rows}
				{#each $rows as row}
					<tr class="align-middle">
						<td>{row.id}</td>
						<td>
							{row.start_timestamp ? new Date(row.start_timestamp).toLocaleString() : '-'}
						</td>
						<td>
							{row.end_timestamp ? new Date(row.end_timestamp).toLocaleString() : '-'}
						</td>
						{#if !columnsToHide.includes('project')}
							<td>
								{#if projects}
									<a href={`/projects/${row.project_id}`}>
										{projects.find((project) => project.id === row.project_id)?.name}
									</a>
								{/if}
							</td>
						{/if}
						{#if !columnsToHide.includes('workflow')}
							<td>
								{#if workflows && row.workflow_id !== null}
									<a href={`/projects/${row.project_id}/workflows/${row.workflow_id}`}>
										{workflows.find((workflow) => workflow.id === row.workflow_id)?.name}
									</a>
								{/if}
							</td>
						{/if}
						<td>
							{#if inputDatasets}
								<a href={`/projects/${row.project_id}/datasets/${row.input_dataset_id}`}>
									{inputDatasets.find((dataset) => dataset.id === row.input_dataset_id)?.name}
								</a>
							{/if}
						</td>
						<td>
							{#if outputDatasets}
								<a href={`/projects/${row.project_id}/datasets/${row.output_dataset_id}`}>
									{outputDatasets.find((dataset) => dataset.id === row.output_dataset_id)?.name}
								</a>
							{/if}
						</td>
						<td>
							<StatusBadge status={row.status} />
						</td>
						<td>
							<button
								class="btn btn-info"
								on:click|preventDefault={() =>
									jobInfoModal.show(row, getProjectName(row.project_id))}
							>
								<i class="bi-info-circle" />
								Info
							</button>
							{#if row.status === 'failed' || row.status === 'done'}
								<button
									class="btn btn-light"
									on:click|preventDefault={() => jobLogsModal.show(row.project_id, row.id)}
								>
									<i class="bi-list-columns-reverse" />
									Logs
								</button>
								<a
									class="btn btn-light"
									href={`/api/v1/project/${row.project_id}/job/${row.id}/download`}
									download={`${row.id}_logs.zip`}
								>
									<i class="bi-arrow-down-circle" />
								</a>
							{/if}
							{#if row.status === 'running'}
								<button class="btn btn-danger" on:click={() => handleJobCancel(row)}>
									<i class="bi-x-circle" /> Cancel
								</button>
							{/if}
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
{/if}

<JobInfoModal {workflows} {datasets} bind:this={jobInfoModal} />
<JobLogsModal bind:this={jobLogsModal} />

<style>
	.jobs-table {
		table-layout: fixed;
		word-break: break-all;
	}

	#id-column {
		width: 60px;
	}
</style>
