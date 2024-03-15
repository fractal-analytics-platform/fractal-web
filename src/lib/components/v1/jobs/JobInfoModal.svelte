<script>
	import StatusBadge from '$lib/components/jobs/StatusBadge.svelte';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import { page } from '$app/stores';
	import Modal from '../../common/Modal.svelte';

	/** @type {import('$lib/types').ApplyWorkflow|undefined} */
	let job = undefined;

	let errorAlert = undefined;
	/** @type {Modal} */
	let modal;

	/**
	 * @param jobToDisplay {import('$lib/types').ApplyWorkflow}
	 */
	export async function show(jobToDisplay) {
		job = jobToDisplay;
		modal.show();
	}

	async function fetchJob() {
		// remove previous error
		if (errorAlert) {
			errorAlert.hide();
		}
		if (!job) {
			return;
		}

		const response = await fetch(`/api/v1/project/${job.project_dump.id}/job/${job.id}`, {
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
		<h1 class="h5 modal-title flex-grow-1">Workflow Job #{job?.id}</h1>
		{#if job && job.user_email === $page.data.userInfo.email && job.project_id !== null}
			<button class="btn btn-light me-3" on:click={fetchJob}>
				<i class="bi-arrow-clockwise" />
			</button>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div class="row mb-3">
			<div class="col-12">
				<div id="workflowJobError" />
				<p class="lead">Workflow job properties</p>
				{#if job}
					<ul class="list-group">
						<li class="list-group-item list-group-item-light fw-bold">Id</li>
						<li class="list-group-item">{job.id}</li>
						<li class="list-group-item list-group-item-light fw-bold">Workflow</li>
						<li class="list-group-item">{job.workflow_dump.name}</li>
						<li class="list-group-item list-group-item-light fw-bold">Project</li>
						<li class="list-group-item">{job.project_dump.name}</li>
						<li class="list-group-item list-group-item-light fw-bold">Input dataset</li>
						<li class="list-group-item">{job.input_dataset_dump.name}</li>
						<li class="list-group-item list-group-item-light fw-bold">Output dataset</li>
						<li class="list-group-item">{job.output_dataset_dump.name}</li>
						<li class="list-group-item list-group-item-light fw-bold">Status</li>
						{#key job.status}
							<li class="list-group-item"><StatusBadge status={job.status} /></li>
						{/key}
						<li class="list-group-item list-group-item-light fw-bold">Working directory</li>
						<li class="list-group-item"><code>{job.working_dir}</code></li>
						<li class="list-group-item list-group-item-light fw-bold">User Working directory</li>
						<li class="list-group-item"><code>{job.working_dir_user}</code></li>
						<li class="list-group-item list-group-item-light fw-bold">SLURM account</li>
						<li class="list-group-item">{job.slurm_account || '-'}</li>
					</ul>
				{/if}
			</div>
		</div>
		<div class="row">
			<div class="col-12" />
		</div>
	</svelte:fragment>
</Modal>
