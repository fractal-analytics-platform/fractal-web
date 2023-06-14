<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { DataHandler, check } from '@vincjo/datatables';
	import StatusBadge from '$lib/components/jobs/StatusBadge.svelte';
	import TimestampBadge from '$lib/components/jobs/TimestampBadge.svelte';
	import JobInfoModal from '$lib/components/jobs/JobInfoModal.svelte';
	import JobLogsModal from '$lib/components/jobs/JobLogsModal.svelte';
	import Th from '$lib/components/common/filterable/Th.svelte';
	import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';

	// Component properties
	let project = $page.data.project;
	let workflows = $page.data.workflows || [];
	let datasets = $page.data.datasets;
	let jobs = $page.data.jobs || [];
	let tableHandler = undefined;
	let rows = undefined;
	let workflowJobInfoId = undefined;

	// Filters
	let workflowFilter = '';
	let inputDatasetFilter = '';
	let outputDatasetFilter = '';
	let statusFilter = '';

	onMount(async () => {
		await setTableHandler();

		// Set filters
		const idFilter = $page.url.searchParams.get('id');
		if (idFilter) {
			tableHandler.filter(idFilter, 'id', check.isEqualTo);
		}

		let workflowQueryFilter = $page.url.searchParams.get('workflow');
		if (workflowQueryFilter) {
			tableHandler.filter(workflowQueryFilter, 'workflow_id', check.isEqualTo);
			workflowFilter = Number.parseInt(workflowQueryFilter);
		}

		let inputDatasetQueryFilter = $page.url.searchParams.get('input_dataset');
		if (inputDatasetQueryFilter) {
			tableHandler.filter(inputDatasetQueryFilter, 'input_dataset_id', check.isEqualTo);
			inputDatasetFilter = Number.parseInt(inputDatasetQueryFilter);
		}

		let outputDatasetQueryFilter = $page.url.searchParams.get('output_dataset');
		if (outputDatasetQueryFilter) {
			tableHandler.filter(outputDatasetQueryFilter, 'output_dataset_id', check.isEqualTo);
			outputDatasetFilter = Number.parseInt(outputDatasetQueryFilter);
		}

		let statusQueryFilter = $page.url.searchParams.get('status');
		if (statusQueryFilter) {
			tableHandler.filter(statusQueryFilter, 'status', check.isEqualTo);
			statusFilter = statusQueryFilter;
		}
	});

	setupTableHandler();

	// Filters
	$: tableHandler.filter(workflowFilter, 'workflow_id', check.isEqualTo);
	$: tableHandler.filter(inputDatasetFilter, 'input_dataset_id', check.isEqualTo);
	$: tableHandler.filter(outputDatasetFilter, 'output_dataset_id', check.isEqualTo);
	$: tableHandler.filter(statusFilter, 'status');

	async function setTableHandler() {
		tableHandler.setRows(jobs);
	}

	function setupTableHandler() {
		// Table handler
		tableHandler = new DataHandler(jobs);
		// Table data
		rows = tableHandler.getRows();
	}

	async function handleJobLogsDownload(jobId) {
		console.log('Download job');

		const response = await fetch(`/projects/${project.id}/jobs/${jobId}/logs`, {
			method: 'GET',
			credentials: 'include'
		});

		if (response.ok) {
			// The response body is a blob
			const blob = await response.blob();
			const downloadUrl = URL.createObjectURL(blob);
			// Create a hidden link within the page to trigger the download of the file
			const link = document.createElement('a');
			// Append the link to the body
			document.body.appendChild(link);
			// Set the href of the link to the download URL
			link.href = downloadUrl;
			link.download = `${jobId}_logs.zip`;
			// Trigger the download
			link.click();
			document.body.removeChild(link);
		}
	}

	async function handleJobCancel(jobId) {
		console.log('Stop running job');

		const response = await fetch(`/projects/${project.id}/jobs/${jobId}?action=stop`, {
			method: 'PATCH',
			credentials: 'include'
		});

		if (response.ok) {
			// Refresh page
			window.location.reload();
		} else {
			console.error('Error stopping job');
			const errorResponse = await response.json();
			new StandardErrorAlert({
				target: document.getElementById('jobUpdatesError'),
				props: {
					error: errorResponse.error
				}
			});
		}
	}

	function openWorkflowJobInfoModal(jobId) {
		workflowJobInfoId = jobId;
		// eslint-disable-next-line
		const infoModal = new bootstrap.Modal(document.getElementById('workflowJobInfoModal'), {});
		infoModal.show();
	}

	function openWorkflowJobLogsModal(jobId) {
		workflowJobInfoId = jobId;
		// eslint-disable-next-line
		const logsModal = new bootstrap.Modal(document.getElementById('workflowJobLogsModal'), {});
		logsModal.show();
	}

</script>

<div class="d-flex justify-content-between align-items-center">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item" aria-current="page">
				<a href="/projects">Projects</a>
			</li>
			{#if project}
				<li class="breadcrumb-item" aria-current="page">
					<a href="/projects/{project.id}">{project.name}</a>
				</li>
			{/if}
			<li class="breadcrumb-item active" aria-current="page">Jobs</li>
		</ol>
	</nav>
	<div />
</div>

{#if project}
	<div class="container">
		<div class="d-flex justify-content-between align-items-center my-3">
			<h1>Project's Jobs</h1>
		</div>

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
					<button
						class="btn btn-primary"
						on:click={() => {
							// Refresh page
							window.location.reload();
						}}><i class="bi-arrow-clockwise" /> Refresh</button
					>
				</div>
			</div>
			<div id='jobUpdatesError' />
			<table class="table">
				<thead class="table-light">
					<tr>
						<Th handler={tableHandler} key="id" label="Id" />
						<Th handler={tableHandler} key="start_timestamp" label="Start" />
						<Th handler={tableHandler} key="end_timestamp" label="End" />
						<Th handler={tableHandler} key="workflow_id" label="Workflow" />
						<Th handler={tableHandler} key="input_dataset_id" label="Input dataset" />
						<Th handler={tableHandler} key="output_dataset_id" label="Output dataset" />
						<Th handler={tableHandler} key="status" label="Status" />
						<th>Options</th>
					</tr>
					<tr>
						<th class="col-3"></th>
						<th> </th>
						<th> </th>
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
						<th>
							{#key inputDatasetFilter}
								<select class="form-control" bind:value={inputDatasetFilter}>
									<option value="">All</option>
									{#each datasets as dataset}
										<option value={dataset.id}>{dataset.name}</option>
									{/each}
								</select>
							{/key}
						</th>
						<th>
							<select class="form-control" bind:value={outputDatasetFilter}>
								<option value="">All</option>
								{#each datasets as dataset}
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
							{#key row}
								<tr class="align-middle">
									<td>{row.id}</td>
									<td>
										<TimestampBadge timestamp={row.start_timestamp} />
									</td>
									<td>
										<TimestampBadge timestamp={row.end_timestamp} />
									</td>
									<td>
										{#if workflows}
											{workflows.find((workflow) => workflow.id === row.workflow_id)?.name}
										{/if}
									</td>
									<td>
										{#if datasets}
											{datasets.find((dataset) => dataset.id === row.input_dataset_id)?.name}
										{/if}
									</td>
									<td>
										{#if datasets}
											{datasets.find((dataset) => dataset.id === row.output_dataset_id)?.name}
										{/if}
									</td>
									<td>
										<StatusBadge status={row.status} />
									</td>
									<td>
										<button
											class='btn btn-info'
											on:click|preventDefault={() => openWorkflowJobInfoModal(row.id)}>
											<i class='bi-info-circle' />
											Info
										</button>
										{#if row.status === 'failed' || row.status === 'done'}
											<button
												class='btn btn-light'
												on:click|preventDefault={() => openWorkflowJobLogsModal(row.id)}
											>
												<i class='bi-list-columns-reverse' />
												Logs
											</button>
											<button
												class='btn btn-light'
												on:click={handleJobLogsDownload.bind(this, row.id)}
											><i class='bi-arrow-down-circle' /></button
											>
										{/if}
										{#if row.status === 'running' }
											<button
												class='btn btn-danger'
												on:click={handleJobCancel.bind(this, row.id)}
											><i class='bi-x-circle' /> Cancel
											</button
											>
										{/if}
									</td>
								</tr>
							{/key}
						{/each}
					{/if}
				</tbody>
			</table>
		{/if}
	</div>
{/if}

<JobInfoModal workflowJobId={workflowJobInfoId} projectName={project.name} {workflows} {datasets} />
<JobLogsModal workflowJobId={workflowJobInfoId} />
