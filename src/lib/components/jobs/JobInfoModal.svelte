<script>
	import StatusBadge from '$lib/components/jobs/StatusBadge.svelte';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import Modal from '../common/Modal.svelte';

	/** @type {import('$lib/types').Dataset[]} */
	export let datasets;
	/** @type {{id: number, name: string}[]} */
	export let workflows;

	/** @type {number|undefined} */
	let workflowJobId = undefined;
	/** @type {import('$lib/types').ApplyWorkflow|undefined} */
	let job = undefined;
	/** @type {number|undefined} */
	let projectId = undefined;
	/** @type {string|undefined} */
	let projectName = undefined;
	let jobWorkflowName = undefined;
	let jobInputDatasetName = undefined;
	let jobOutputDatasetName = undefined;
	let jobStatus = undefined;

	let errorAlert = undefined;
	/** @type {Modal} */
	let modal;

	/**
	 * @param jobToDisplay {import('$lib/types').ApplyWorkflow}
	 * @param projectNameToDisplay {string}
	 */
	export async function show(jobToDisplay, projectNameToDisplay) {
		job = jobToDisplay;
		workflowJobId = job.id;
		projectId = job.project_id;
		projectName = projectNameToDisplay;
		// Should update jobWorkflowName
		jobWorkflowName = workflows.find((workflow) => workflow.id === jobToDisplay.workflow_id)?.name;
		// Should update jobInputDatasetName
		jobInputDatasetName = datasets.find((dataset) => dataset.id === jobToDisplay.input_dataset_id)?.name;
		// Should update jobOutputDatasetName
		jobOutputDatasetName = datasets.find((dataset) => dataset.id === jobToDisplay.output_dataset_id)?.name;
		// Should update jobStatus
		jobStatus = job.status;

		modal.show();
	}

	async function fetchJob() {
		// remove previous error
		if (errorAlert) {
			errorAlert.hide();
		}

		const response = await fetch(`/api/v1/project/${projectId}/job/${workflowJobId}`, {
			method: 'GET',
			credentials: 'include'
		});

		const result = await response.json();
		if (response.ok) {
			job = result;
		} else {
			errorAlert = displayStandardErrorAlert(result, 'workflowJobError');
		}
	}
</script>

<Modal id="workflowJobInfoModal" bind:this={modal} size="lg">
	<svelte:fragment slot="header">
		<h1 class="h5 modal-title flex-grow-1">Workflow Job #{workflowJobId}</h1>
		<button class="btn btn-light me-3" on:click={fetchJob}>
			<i class="bi-arrow-clockwise" />
		</button>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div class="row mb-3">
			<div class="col-12">
				<div id="workflowJobError" />
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
	</svelte:fragment>
</Modal>
