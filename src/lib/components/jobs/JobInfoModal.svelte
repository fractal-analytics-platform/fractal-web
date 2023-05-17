<script>
	import { page } from '$app/stores';
	import { afterUpdate, onMount } from 'svelte';
	import StatusBadge from '$lib/components/jobs/StatusBadge.svelte';

	export let workflowJobId = undefined;
	let job = undefined;
	export let projectName = undefined;
	export let datasets = undefined;
	export let workflows = undefined;
	let jobWorkflowName = undefined;
	let jobInputDatasetName = undefined;
	let jobOutputDatasetName = undefined;
	let jobStatus = undefined;

	onMount(async () => {});

	afterUpdate(async () => {
		// If workflowJobId is undefined, do nothing
		if (workflowJobId === undefined) return;
		// Should fetch job info from server
		if (job === undefined) await fetchJob();
		// Should update jobWorkflowName
		jobWorkflowName = workflows.find((workflow) => workflow.id === job.workflow_id)?.name;
		// Should update jobInputDatasetName
		jobInputDatasetName = datasets.find((dataset) => dataset.id === job.input_dataset_id)?.name;
		// Should update jobOutputDatasetName
		jobOutputDatasetName = datasets.find((dataset) => dataset.id === job.output_dataset_id)?.name;
		// Should update jobStatus
		jobStatus = job.status;
	});

	async function fetchJob() {
		const request = await fetch(`/projects/${$page.params.projectId}/jobs/${workflowJobId}`, {
			method: 'GET',
			credentials: 'include'
		});

		if (request.status === 200) {
			job = await request.json();
		} else {
			console.error(request);
		}
	}
</script>

<div class="modal modal-lg" id="workflowJobInfoModal">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header d-flex justify-content-between">
				<h1 class="h5 modal-title">Workflow Job #{workflowJobId}</h1>
				<div class="d-flex align-items-center">
					<button class="btn btn-light me-3" on:click={fetchJob}
						><i class="bi-arrow-clockwise" /></button
					>
					<button class="btn-close bg-light p-2" data-bs-dismiss="modal" />
				</div>
			</div>
			<div class="modal-body">
				<div class="row mb-3">
					<div class="col-12">
						<p class="lead">Workflow job properties</p>
						<ul class="list-group">
							<li class="list-group-item list-group-item-light fw-bold">Id</li>
							<li class="list-group-item">{job?.id}</li>
							<li class="list-group-item list-group-item-light fw-bold">Workflow</li>
							<li class="list-group-item">{jobWorkflowName}</li>
							<li class="list-group-item list-group-item-light fw-bold">Project</li>
							<li class="list-group-item">{projectName}</li>
							<li class="list-group-item list-group-item-light fw-bold">Input dataset</li>
							<li class="list-group-item">{jobInputDatasetName}</li>
							<li class="list-group-item list-group-item-light fw-bold">Output dataset</li>
							<li class="list-group-item">{jobOutputDatasetName}</li>
							<li class="list-group-item list-group-item-light fw-bold">Status</li>
							{#key jobStatus}
								<li class="list-group-item"><StatusBadge status={jobStatus} /></li>
							{/key}
							<li class="list-group-item list-group-item-light fw-bold">Working directory</li>
							<li class="list-group-item"><code>{job?.working_dir}</code></li>
							<li class="list-group-item list-group-item-light fw-bold">User Working directory</li>
							<li class="list-group-item"><code>{job?.working_dir_user}</code></li>
						</ul>
					</div>
				</div>
				<div class="row">
					<div class="col-12" />
				</div>
			</div>
		</div>
	</div>
</div>
