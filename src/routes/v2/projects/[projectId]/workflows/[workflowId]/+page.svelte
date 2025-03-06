<script>
	import { env } from '$env/dynamic/public';
	import { onDestroy, onMount, tick } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import MetaPropertiesForm from '$lib/components/v2/workflow/MetaPropertiesForm.svelte';
	import ArgumentsSchema from '$lib/components/v2/workflow/ArgumentsSchema.svelte';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import VersionUpdate from '$lib/components/v2/workflow/VersionUpdate.svelte';
	import { getAllNewVersions } from '$lib/components/v2/workflow/version-checker';
	import ImagesStatus from '$lib/components/jobs/ImagesStatus.svelte';
	import TasksOrderModal from '$lib/components/v2/workflow/TasksOrderModal.svelte';
	import { extractRelevantJobError } from '$lib/common/job_utilities';
	import JobLogsModal from '$lib/components/v2/jobs/JobLogsModal.svelte';
	import TaskInfoTab from '$lib/components/v2/workflow/TaskInfoTab.svelte';
	import InputFiltersTab from '$lib/components/v2/workflow/InputFiltersTab.svelte';
	import RunWorkflowModal from '$lib/components/v2/workflow/RunWorkflowModal.svelte';
	import { getSelectedWorkflowDataset, saveSelectedDataset } from '$lib/common/workflow_utilities';
	import AddWorkflowTaskModal from '$lib/components/v2/workflow/AddWorkflowTaskModal.svelte';
	import TypeFiltersFlowModal from '$lib/components/v2/workflow/TypeFiltersFlowModal.svelte';
	import { slide } from 'svelte/transition';
	import ImagesStatusModal from '$lib/components/jobs/ImagesStatusModal.svelte';
	import JobStatusIcon from '$lib/components/jobs/JobStatusIcon.svelte';

	/** @type {import('fractal-components/types/api').WorkflowV2} */
	let workflow = $page.data.workflow;
	/** @type {number|undefined} */
	let defaultDatasetId = $page.data.defaultDatasetId;
	$: project = workflow.project;
	/** @type {import('fractal-components/types/api').DatasetV2[]} */
	let datasets = $page.data.datasets;
	let attributeFiltersEnabled = $page.data.attributeFiltersEnabled;

	/** @type {number|undefined} */
	let selectedDatasetId = undefined;

	let isLegacy = false;
	/** @type {{[key: number]: import('fractal-components/types/api').JobStatus}} */
	let legacyStatuses = {};

	let jobError = '';
	/** @type {import('fractal-components/types/api').ApplyWorkflowV2|undefined} */
	let failedJob;
	/** @type {JobLogsModal} */
	let jobLogsModal;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let workflowErrorAlert = undefined;

	let workflowTabContextId = 0;
	let workflowSuccessMessage = '';
	/** @type {import('fractal-components/types/api').WorkflowTaskV2|undefined} */
	let selectedWorkflowTask = undefined;
	/** @type {number|undefined} */
	let expandedWorkflowTaskId = undefined;
	/** @type {import('fractal-components/types/api').WorkflowTaskV2|undefined} */
	let preventedSelectedTaskChange = undefined;
	/** @type {import('fractal-components/types/api').SubsetStatus|undefined} */
	let preventedSelectedSubsetChange = undefined;
	/** @type {import('fractal-components/types/api').SubsetStatus[]} */
	let subsetStatuses = [];
	let loadingSubsetStatuses = false;
	/** @type {ImagesStatusModal} */
	let imagesStatusModal;
	/** @type {import('fractal-components/types/api').SubsetStatus|undefined} */
	let selectedSubset = undefined;

	/** @type {ArgumentsSchema|undefined} */
	let argsSchemaForm = undefined;
	/** @type {MetaPropertiesForm|undefined} */
	let metaPropertiesForm = undefined;

	let argsChangesSaved = false;

	/** @type {InputFiltersTab|undefined} */
	let inputFiltersTab = undefined;

	// Update workflow modal
	let updatedWorkflowName = '';

	// Modals
	/** @type {Modal} */
	let argsUnsavedChangesModal;
	/** @type {Modal} */
	let filtersUnsavedChangesModal;
	/** @type {Modal} */
	let metaPropertiesUnsavedChangesModal;
	/** @type {RunWorkflowModal} */
	let runWorkflowModal;
	/** @type {import('$lib/components/v2/workflow/TasksOrderModal.svelte').default} */
	let editTasksOrderModal;
	/** @type {AddWorkflowTaskModal} */
	let addWorkflowTaskModal;
	/** @type {Modal} */
	let editWorkflowModal;
	/** @type {TypeFiltersFlowModal} */
	let typeFiltersFlowModal;

	/** @type {{ [id: string]: import('fractal-components/types/api').TaskV2[] }} */
	let newVersionsMap = {};
	/** @type {{ [id: string]: string | null }} */
	let tasksVersions = {};

	/** @type {import('fractal-components/types/api').ApplyWorkflowV2|undefined} */
	let selectedSubmittedJob;

	let mounted = false;

	$: updatableWorkflowList = workflow.task_list || [];

	$: sortedDatasets = datasets.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

	const updateJobsInterval = env.PUBLIC_UPDATE_JOBS_INTERVAL
		? parseInt(env.PUBLIC_UPDATE_JOBS_INTERVAL)
		: 3000;

	onMount(async () => {
		mounted = false;
		selectedDatasetId = getSelectedWorkflowDataset(workflow, datasets, defaultDatasetId);
		await loadJobsStatus();
		await checkNewVersions();
		mounted = true;
	});

	beforeNavigate((navigation) => {
		if (argsSchemaForm?.hasUnsavedChanges()) {
			// Prevent navigation
			navigation.cancel();
			toggleArgsUnsavedChangesModal();
		}

		if (inputFiltersTab?.hasUnsavedChanges()) {
			// Prevent navigation
			navigation.cancel();
			toggleFiltersUnsavedChangesModal();
		}

		if (metaPropertiesForm?.hasUnsavedChanges()) {
			// Prevent navigation
			navigation.cancel();
			toggleMetaPropertiesUnsavedChangesModal();
		}
	});

	/**
	 * @param {number} id
	 */
	function setWorkflowTabContextId(id) {
		if (argsSchemaForm?.hasUnsavedChanges()) {
			toggleArgsUnsavedChangesModal();
			return;
		}
		if (inputFiltersTab?.hasUnsavedChanges()) {
			toggleFiltersUnsavedChangesModal();
			return;
		}
		if (metaPropertiesForm?.hasUnsavedChanges()) {
			toggleMetaPropertiesUnsavedChangesModal();
			return;
		}
		workflowTabContextId = id;
	}

	/**
	 * Exports a project's workflow from the server
	 * @returns {Promise<void>}
	 */
	async function handleExportWorkflow() {
		if (!workflow) {
			return;
		}

		const response = await fetch(`/api/v2/project/${project.id}/workflow/${workflow.id}/export`, {
			method: 'GET',
			credentials: 'include'
		});

		if (!response.ok) {
			console.error(await response.json());
			return;
		}

		const workflowData = await response.json();

		if (workflowData !== null) {
			const file = new File(
				[JSON.stringify(workflowData, null, 2)],
				`workflow-export-${workflow.name}-${Date.now().toString()}.json`,
				{
					type: `application/json`
				}
			);
			const fileUrl = URL.createObjectURL(file);
			const linkElement = /** @type {HTMLAnchorElement} */ (
				document.getElementById('downloadWorkflowButton')
			);
			linkElement.download = `workflow-export-${workflow.name}-${Date.now().toString()}.json`;
			linkElement.href = fileUrl;
			linkElement.click();
		}
	}

	function resetWorkflowUpdateModal() {
		if (!workflow) {
			return;
		}
		updatedWorkflowName = workflow.name;
	}

	let workflowUpdating = false;

	/**
	 * Updates a project's workflow in the server
	 * @returns {Promise<void>}
	 */
	async function handleWorkflowUpdate() {
		editWorkflowModal.confirmAndHide(
			async () => {
				workflowSuccessMessage = '';
				if (!workflow) {
					return;
				}
				workflowUpdating = true;

				const headers = new Headers();
				headers.set('Content-Type', 'application/json');

				const response = await fetch(`/api/v2/project/${project.id}/workflow/${workflow.id}`, {
					method: 'PATCH',
					credentials: 'include',
					headers,
					body: JSON.stringify({
						name: updatedWorkflowName
					})
				});

				if (response.ok) {
					workflow = await response.json();
					workflowSuccessMessage = 'Workflow updated correctly';
				} else {
					console.error('Error updating workflow properties');
					throw await getAlertErrorFromResponse(response);
				}
			},
			() => {
				workflowUpdating = false;
			}
		);
	}

	/**
	 * @param {import('fractal-components/types/api').WorkflowV2} updatedWorkflow
	 */
	async function onWorkflowTaskAdded(updatedWorkflow) {
		workflow = updatedWorkflow;
		workflowSuccessMessage = 'Workflow task created';
		await checkNewVersions();
	}

	/**
	 * Deletes a project's workflow task from the server
	 * @returns {Promise<void>}
	 */
	async function handleDeleteWorkflowTask() {
		if (!workflow || !selectedWorkflowTask) {
			return;
		}
		const response = await fetch(
			`/api/v2/project/${project.id}/workflow/${workflow.id}/wftask/${selectedWorkflowTask.id}`,
			{
				method: 'DELETE',
				credentials: 'include'
			}
		);

		if (!response.ok) {
			console.error('Unable to delete workflow task');
			throw await getAlertErrorFromResponse(response);
		}

		// Discard unsaved changes when workflow task is deleted
		argsSchemaForm?.discardChanges();
		inputFiltersTab?.discardChanges();
		metaPropertiesForm?.discardChanges();

		// Get updated workflow with deleted task
		const workflowResponse = await fetch(`/api/v2/project/${project.id}/workflow/${workflow.id}`, {
			method: 'GET',
			credentials: 'include'
		});

		if (!workflowResponse.ok) {
			console.error('Unable to retrieve workflow');
			throw await getAlertErrorFromResponse(workflowResponse);
		}

		// Successfully deleted task
		workflow = await workflowResponse.json();
		selectedWorkflowTask = undefined;
	}

	/**
	 * @param {import('fractal-components/types/api').WorkflowTaskV2|undefined} wft
	 */
	async function setSelectedWorkflowTask(wft) {
		await tick();
		preventedSelectedTaskChange = wft;
		if (checkUnsavedChanges()) {
			return;
		}
		if (wft) {
			selectedWorkflowTask = wft;
			if (expandedWorkflowTaskId !== wft.id) {
				expandedWorkflowTaskId = undefined;
			}
		}
		preventedSelectedTaskChange = undefined;
		selectedSubset = undefined;
		await tick();
		await inputFiltersTab?.init();
	}

	/**
	 * @param {import('fractal-components/types/api').SubsetStatus|undefined} subsetStatus
	 */
	async function selectSubset(subsetStatus) {
		await tick();
		preventedSelectedSubsetChange = subsetStatus;
		if (checkUnsavedChanges()) {
			return;
		}
		preventedSelectedSubsetChange = undefined;
		selectedSubset = subsetStatus;
	}

	function checkUnsavedChanges() {
		if (argsSchemaForm?.hasUnsavedChanges()) {
			toggleArgsUnsavedChangesModal();
			return true;
		}
		if (inputFiltersTab?.hasUnsavedChanges()) {
			toggleFiltersUnsavedChangesModal();
			return true;
		}
		if (metaPropertiesForm?.hasUnsavedChanges()) {
			toggleMetaPropertiesUnsavedChangesModal();
			return true;
		}
		return false;
	}

	/**
	 * @param {number} workflowTaskId
	 */
	async function loadSubsetStatus(workflowTaskId) {
		subsetStatuses = [];
		expandedWorkflowTaskId = workflowTaskId;
		loadingSubsetStatuses = true;
		const response = await fetch(
			`/api/v2/project/${workflow.project_id}/status/subsets?workflowtask_id=${workflowTaskId}&dataset_id=${selectedDatasetId}`
		);
		if (!response.ok) {
			loadingSubsetStatuses = false;
			return;
		}
		subsetStatuses = await response.json();
		await tick(); // to trigger animation
		loadingSubsetStatuses = false;
	}

	function toggleArgsUnsavedChangesModal() {
		argsUnsavedChangesModal.toggle();
	}

	function toggleFiltersUnsavedChangesModal() {
		filtersUnsavedChangesModal.toggle();
	}

	function toggleMetaPropertiesUnsavedChangesModal() {
		metaPropertiesUnsavedChangesModal.toggle();
	}

	/**
	 * @param {'run'|'restart'|'continue'} action
	 */
	async function openRunWorkflowModal(action) {
		if (argsSchemaForm?.hasUnsavedChanges()) {
			toggleArgsUnsavedChangesModal();
		} else if (inputFiltersTab?.hasUnsavedChanges()) {
			toggleFiltersUnsavedChangesModal();
		} else if (metaPropertiesForm?.hasUnsavedChanges()) {
			toggleMetaPropertiesUnsavedChangesModal();
		} else {
			await reloadSelectedDataset();
			await tick();
			runWorkflowModal.open(action);
		}
	}

	/**
	 *
	 * @param {import('fractal-components/types/api').ApplyWorkflowV2} job
	 */
	async function onJobSubmitted(job) {
		selectedSubmittedJob = job;
		selectedSubset = undefined;
		expandedWorkflowTaskId = undefined;
		await loadJobsStatus();
	}

	/**
	 * Called by VersionUpdate component at the end of the update to reload the workflow.
	 * @param workflowTask {import('fractal-components/types/api').WorkflowTaskV2}
	 */
	async function taskUpdated(workflowTask) {
		if (!workflow) {
			return;
		}
		workflowSuccessMessage = '';
		if (workflowErrorAlert) {
			workflowErrorAlert.hide();
		}

		const workflowResponse = await fetch(`/api/v2/project/${project.id}/workflow/${workflow.id}`, {
			method: 'GET',
			credentials: 'include'
		});

		const workflowResult = await workflowResponse.json();

		if (!workflowResponse.ok) {
			workflowErrorAlert = displayStandardErrorAlert(
				'Error while retrieving workflow',
				'workflowErrorAlert'
			);
			return;
		}

		workflow = workflowResult;
		selectedWorkflowTask = workflowTask;
		workflowSuccessMessage = 'Task version updated successfully';
		await checkNewVersions();
	}

	async function checkNewVersions() {
		if (workflow) {
			const { updateCandidates, enrichedTasks } = await getAllNewVersions(
				workflow.task_list.map((wt) => wt.task)
			);
			newVersionsMap = updateCandidates;
			tasksVersions = Object.fromEntries(enrichedTasks.map((t) => [t.id, t.version]));
		}
	}

	let newVersionsCount = 0;
	/**
	 * Used to receive new version count from VersionUpdate component.
	 * @param count {number}
	 */
	async function updateNewVersionsCount(count) {
		newVersionsCount = count;
	}

	/** @type {{[key: number]: import('fractal-components/types/api').ImagesStatus}} */
	let statuses = {};

	$: hasAnyJobRun = Object.keys(statuses).length > 0;

	/** @type {number|undefined} */
	let statusWatcherTimer;

	async function selectedDatasetChanged() {
		await tick();
		saveSelectedDataset(workflow, selectedDatasetId);
		await inputFiltersTab?.init();
		await loadJobsStatus();
	}

	async function loadJobsStatus() {
		if (selectedDatasetId === undefined) {
			statuses = {};
			jobError = '';
			failedJob = undefined;
			selectedSubmittedJob = undefined;
			return;
		}
		selectedSubmittedJob = await getSelectedJob(selectedDatasetId);
		const statusResponse = await fetch(
			`/api/v2/project/${workflow.project_id}/status?dataset_id=${selectedDatasetId}&workflow_id=${workflow.id}`,
			{
				method: 'GET',
				credentials: 'include'
			}
		);
		const receivedStatuses = await statusResponse.json();
		if (!statusResponse.ok) {
			console.error('Error retrieving images status', receivedStatuses);
			return;
		}
		const jobHasError = selectedSubmittedJob?.status === 'failed';
		statuses = Object.fromEntries(Object.entries(receivedStatuses).filter(([, v]) => v !== null));
		if (selectedSubmittedJob && Object.keys(statuses).length === 0) {
			await loadLegacyStatus();
		} else {
			isLegacy = false;
		}
		const submitted = Object.values(statuses).filter((s) => s.num_submitted_images > 0);
		if (submitted.length > 0 || selectedSubmittedJob?.status === 'submitted') {
			window.clearTimeout(statusWatcherTimer);
			statusWatcherTimer = window.setTimeout(
				loadJobsStatus,
				submitted.length > 0 ? updateJobsInterval : 0
			);
		} else {
			await reloadSelectedDataset();
			selectedSubmittedJob = undefined;
		}
		await loadJobError(jobHasError);
	}

	async function loadLegacyStatus() {
		const response = await fetch(
			`/api/v2/project/1/status-legacy?workflow_id=${workflow.id}&dataset_id=${selectedDatasetId}`
		);
		if (!response.ok) {
			console.log('Error loading legacy status');
			return;
		}
		const result = await response.json();
		if (Object.keys(result).length === 0) {
			return;
		}
		legacyStatuses = result.status;
		isLegacy = true;
	}

	async function reloadSelectedDataset() {
		if (selectedDatasetId === undefined) {
			return;
		}
		const datasetId = selectedDatasetId;
		const response = await fetch(`/api/v2/project/${project.id}/dataset/${datasetId}`, {
			method: 'GET',
			credentials: 'include'
		});
		const result = await response.json();
		if (!response.ok) {
			console.error(result);
			return;
		}
		datasets = datasets.map((d) => (d.id === datasetId ? result : d));
	}

	/**
	 * @param {boolean} jobHasError
	 */
	async function loadJobError(jobHasError) {
		if (!jobHasError && Object.values(statuses).length > 0) {
			const failedStatus = Object.values(statuses).find((s) => s.num_failed_images > 0);
			if (!failedStatus) {
				jobError = '';
				failedJob = undefined;
				return;
			}
		}
		const response = await fetch(`/api/v2/project/${project.id}/workflow/${workflow.id}/job`, {
			method: 'GET',
			credentials: 'include'
		});
		if (!response.ok) {
			console.error('Error retrieving workflow jobs', await response.json());
			return;
		}
		const jobs = /** @type {import('fractal-components/types/api').ApplyWorkflowV2[]} */ (
			await response.json()
		);
		const failedJobs = jobs
			.filter((j) => j.dataset_id === selectedDatasetId && j.status === 'failed')
			.sort((j1, j2) => (j1.start_timestamp < j2.start_timestamp ? 1 : -1));
		if (failedJobs.length === 0) {
			jobError = '';
			failedJob = undefined;
			return;
		}
		failedJob = failedJobs[0];
		jobError = extractRelevantJobError(failedJob.log || '', 5);
	}

	function showJobLogsModal() {
		if (!failedJob) {
			return;
		}
		jobLogsModal.show(failedJob, false);
	}

	/**
	 * @param {number} datasetId
	 * @return {Promise<import('fractal-components/types/api').ApplyWorkflowV2|undefined>}
	 */
	async function getSelectedJob(datasetId) {
		const submitted = Object.values(statuses).filter((s) => s.num_submitted_images > 0);
		if (
			submitted.length > 0 &&
			selectedSubmittedJob &&
			selectedSubmittedJob.dataset_id === datasetId
		) {
			return selectedSubmittedJob;
		}
		const response = await fetch(`/api/v2/project/${project.id}/workflow/${workflow.id}/job`, {
			method: 'GET',
			credentials: 'include'
		});
		if (response.ok) {
			/** @type {import('fractal-components/types/api').ApplyWorkflowV2[]} */
			const allJobs = await response.json();
			const jobs = allJobs
				.filter((j) => j.dataset_id === datasetId)
				.sort((a, b) => (a.start_timestamp < b.start_timestamp ? 1 : -1));
			if (jobs.length > 0) {
				return jobs[0];
			}
		} else {
			console.error('Unable to load workflow jobs', await response.json());
		}
	}

	async function stopWorkflow() {
		if (!selectedSubmittedJob) {
			return;
		}
		if (workflowErrorAlert) {
			workflowErrorAlert.hide();
		}
		const response = await fetch(
			`/api/v2/project/${project.id}/job/${selectedSubmittedJob.id}/stop`,
			{
				method: 'GET',
				credentials: 'include'
			}
		);
		if (response.ok) {
			await loadJobsStatus();
		} else {
			console.error('Error stopping job');
			workflowErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'workflowErrorAlert'
			);
		}
	}

	/**
	 * @param {import('fractal-components/types/api').WorkflowTaskV2} updatedWft
	 */
	function onWorkflowTaskUpdated(updatedWft) {
		selectedWorkflowTask = updatedWft;
		argsChangesSaved = true;
		setTimeout(() => {
			argsChangesSaved = false;
		}, 3000);
		workflow.task_list = workflow.task_list.map((t) => (t.id === updatedWft.id ? updatedWft : t));
	}

	/**
	 * @param {import('fractal-components/types/api').WorkflowTaskV2} updatedWft
	 */
	function onInputFiltersUpdated(updatedWft) {
		selectedWorkflowTask = updatedWft;
		workflow.task_list = workflow.task_list.map((t) => (t.id === updatedWft.id ? updatedWft : t));
	}

	onDestroy(() => {
		clearTimeout(statusWatcherTimer);
	});
</script>

<div class="row">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item" aria-current="page">
				<a href="/v2/projects">Projects</a>
			</li>
			{#if $page.params.projectId}
				<li class="breadcrumb-item" aria-current="page">
					<a href="/v2/projects/{$page.params.projectId}">{project?.name}</a>
				</li>
			{/if}
			<li class="breadcrumb-item">Workflows</li>
			{#if workflow}
				<li class="breadcrumb-item active">
					{workflow.name}
				</li>
			{/if}
		</ol>
	</nav>
</div>
<div class="row mt-2">
	<div class="col-lg-8">
		<div class="row">
			<div class="col-lg-4 col-md-6">
				<div class="input-group mb-3">
					<label for="dataset" class="input-group-text">Dataset</label>
					<select
						class="form-select"
						id="dataset"
						bind:value={selectedDatasetId}
						on:change={selectedDatasetChanged}
					>
						<option value={undefined}>Select...</option>
						{#each sortedDatasets as dataset}
							<option value={dataset.id}>{dataset.name}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="col-lg-8 col-md-12">
				{#if selectedSubmittedJob && selectedSubmittedJob.status === 'submitted'}
					<button class="btn btn-danger" on:click={stopWorkflow}>
						<i class="bi-stop-circle-fill" /> Stop workflow
					</button>
				{:else if !hasAnyJobRun}
					<button
						class="btn btn-success"
						on:click|preventDefault={() => openRunWorkflowModal('run')}
						disabled={selectedDatasetId === undefined || workflow.task_list.length === 0}
					>
						<i class="bi-play-fill" /> Run workflow
					</button>
				{:else}
					<button
						class="btn btn-success"
						on:click|preventDefault={() => openRunWorkflowModal('continue')}
						disabled={workflow.task_list.length === 0}
					>
						<i class="bi-play-fill" /> Continue workflow
					</button>
					<button
						class="btn btn-primary"
						on:click|preventDefault={() => openRunWorkflowModal('restart')}
						disabled={workflow.task_list.length === 0}
					>
						<i class="bi bi-arrow-clockwise" /> Restart workflow
					</button>
				{/if}
			</div>
		</div>
	</div>

	<div class="col-lg-4 mb-2">
		<div class="float-end">
			{#if $page.data.userInfo.is_superuser}
				<button
					class="btn btn-light"
					on:click|preventDefault={() => typeFiltersFlowModal.open()}
					disabled={workflow.task_list.length === 0}
				>
					Type filters flow
				</button>
			{/if}
			<a href="/v2/projects/{project?.id}/workflows/{workflow?.id}/jobs" class="btn btn-light">
				<i class="bi-journal-code" /> List jobs
			</a>
			<button
				class="btn btn-light"
				on:click|preventDefault={handleExportWorkflow}
				aria-label="Export workflow"
			>
				<i class="bi-download" />
			</button>
			<a id="downloadWorkflowButton" class="d-none">Download workflow link</a>
			<button
				class="btn btn-light"
				data-bs-toggle="modal"
				data-bs-target="#editWorkflowModal"
				on:click={resetWorkflowUpdateModal}
			>
				<i class="bi-pencil" />
			</button>
		</div>
	</div>
</div>

<TypeFiltersFlowModal
	{workflow}
	{selectedDatasetId}
	datasets={sortedDatasets}
	bind:this={typeFiltersFlowModal}
/>

{#if workflow}
	<StandardDismissableAlert message={workflowSuccessMessage} />

	<div id="workflowErrorAlert" />

	{#if jobError}
		<div class="alert border border-danger bg-light">
			<div class="row">
				<div class="col-md-10 col-sm-9">
					<div class="text-muted mb-2 fw-bolder">The last job failed with the following error:</div>
					<pre class="text-danger mb-0">{jobError}</pre>
				</div>
				<div class="col-md-2 col-sm-3">
					<button class="btn btn-outline-secondary float-end" on:click={showJobLogsModal}>
						Show complete log
					</button>
				</div>
			</div>
		</div>
	{/if}

	<div class="container mt-3 px-0">
		<div class="row">
			<div class="col-4">
				<div class="card">
					<div class="card-header">
						<div class="d-flex justify-content-between align-items-center">
							<span>Workflow sequence</span>
							<div>
								<button
									class="btn btn-light"
									aria-label="Add task to workflow"
									on:click={() => {
										workflowSuccessMessage = '';
										addWorkflowTaskModal.show();
									}}
								>
									<i class="bi-plus-lg" />
								</button>
								<button
									class="btn btn-light"
									aria-label="Edit tasks order"
									on:click={() => editTasksOrderModal.show(updatableWorkflowList)}
								>
									<i class="bi-arrow-down-up" />
								</button>
							</div>
						</div>
					</div>

					{#if workflow.task_list.length == 0}
						<p class="text-center mt-3">No workflow tasks yet, add one.</p>
					{:else if mounted}
						<div class="list-group list-group-flush" data-testid="workflow-tasks-list">
							{#each workflow.task_list as workflowTask}
								<button
									style="cursor: pointer"
									class="list-group-item list-group-item-action"
									class:active={selectedWorkflowTask !== undefined &&
										selectedWorkflowTask.id === workflowTask.id}
									data-fs-target={workflowTask.id}
									on:click|preventDefault={() => setSelectedWorkflowTask(workflowTask)}
								>
									{#if statuses[workflowTask.id]}
										{#if expandedWorkflowTaskId === workflowTask.id && loadingSubsetStatuses}
											<span
												class="spinner-border spinner-border-sm p-0"
												role="status"
												aria-hidden="true"
											/>
										{:else if expandedWorkflowTaskId === workflowTask.id}
											<button
												aria-label="Hide subsets"
												class="btn btn-link p-0 text-white"
												on:click={() => (expandedWorkflowTaskId = undefined)}
											>
												<i class="bi bi-caret-down-fill" />
											</button>
										{:else}
											<button
												aria-label="Show subsets"
												class="btn btn-link p-0"
												class:text-white={selectedWorkflowTask?.id === workflowTask.id}
												on:click={() => loadSubsetStatus(workflowTask.id)}
											>
												<i class="bi bi-caret-right-fill" />
											</button>
										{/if}
									{/if}
									{workflowTask.task.name}
									<span class="float-end ps-2">
										{#if selectedDatasetId}
											{#if isLegacy}
												<JobStatusIcon status={legacyStatuses[workflowTask.id]} />
											{:else}
												<ImagesStatus
													status={statuses[workflowTask.id]}
													datasetId={selectedDatasetId}
													projectId={project.id}
													workflowTaskId={workflowTask.id}
													{imagesStatusModal}
												/>
											{/if}
										{/if}
									</span>
									{#if newVersionsMap[workflowTask.task.id]?.length > 0}
										<span class="float-end text-info" title="new version available">
											<i class="bi bi-arrow-up-circle-fill" />
										</span>
									{/if}
									{#if workflowTask.warning}
										<span class="float-end text-warning" title={workflowTask.warning}>
											<i class="bi bi-exclamation-triangle-fill" />
										</span>
									{/if}
								</button>
								{#each subsetStatuses as status, index}
									{#if !loadingSubsetStatuses && expandedWorkflowTaskId === workflowTask.id}
										<button
											transition:slide
											class="subset-item list-group-item list-group-item-action"
											class:active={selectedSubset &&
												selectedSubset.parameters_hash === status.parameters_hash}
											style="padding-left: 38px"
											on:click={() => selectSubset(status)}
										>
											Subset {index + 1}
											<span class="float-end ps-2">
												{#if selectedDatasetId}
													<ImagesStatus
														status={status.info}
														datasetId={selectedDatasetId}
														projectId={project.id}
														workflowTaskId={workflowTask.id}
														parametersHash={status.parameters_hash}
														{imagesStatusModal}
													/>
												{/if}
											</span>
										</button>
									{/if}
								{/each}
							{/each}
						</div>
					{/if}
				</div>
			</div>
			<div class="col-8">
				{#if selectedWorkflowTask?.warning}
					<div class="alert alert-warning">
						<i class="bi bi-exclamation-triangle-fill" />
						{selectedWorkflowTask.warning}
					</div>
				{/if}
				<div class="card">
					<div class="card-header py-1">
						{#if selectedWorkflowTask}
							<div class="d-flex justify-content-between">
								<ul class="nav nav-tabs card-header-tabs">
									<li class="nav-item">
										<button
											class="nav-link {workflowTabContextId === 0 ? 'active' : ''}"
											on:click={() => setWorkflowTabContextId(0)}
											aria-current={workflowTabContextId === 0}
											>Arguments
										</button>
									</li>
									<li class="nav-item">
										<button
											class="nav-link {workflowTabContextId === 1 ? 'active' : ''}"
											on:click={() => setWorkflowTabContextId(1)}
											aria-current={workflowTabContextId === 1}
										>
											Meta
										</button>
									</li>
									<li class="nav-item">
										<button
											class="nav-link {workflowTabContextId === 2 ? 'active' : ''}"
											on:click={() => setWorkflowTabContextId(2)}
											aria-current={workflowTabContextId === 2}
										>
											Info
										</button>
									</li>
									<li class="nav-item">
										<button
											class="nav-link {workflowTabContextId === 3 ? 'active' : ''}"
											on:click={() => setWorkflowTabContextId(3)}
											aria-current={workflowTabContextId === 3}
										>
											Types
										</button>
									</li>
									<li class="nav-item">
										<button
											class="nav-link {workflowTabContextId === 4 ? 'active' : ''}"
											on:click={() => setWorkflowTabContextId(4)}
											aria-current={workflowTabContextId === 4}
										>
											Version
											{#if newVersionsCount}
												<span class="badge bg-primary rounded-pill">{newVersionsCount}</span>
											{/if}
										</button>
									</li>
								</ul>
								<ConfirmActionButton
									modalId="confirmDeleteWorkflowTask"
									btnStyle="danger"
									buttonIcon="trash"
									message="Delete a workflow task {selectedWorkflowTask.task.name}"
									callbackAction={handleDeleteWorkflowTask}
									ariaLabel="Delete workflow task"
								/>
							</div>
						{:else}
							Select a workflow task from the list
						{/if}
					</div>
					<div class="tab-content">
						{#if workflowTabContextId === 0}
							<div id="args-tab" class="tab-pane show active">
								<div class="card-body p-0">
									{#if argsChangesSaved}
										<div class="alert alert-success m-3" role="alert">
											Arguments changes saved successfully
										</div>
									{/if}
									{#if selectedWorkflowTask}
										{#key selectedWorkflowTask}
											<ArgumentsSchema
												workflowTask={selectedWorkflowTask}
												{onWorkflowTaskUpdated}
												editable={!selectedSubset}
												bind:this={argsSchemaForm}
												argsNonParallel={selectedSubset?.workflowtask_dump.args_non_parallel}
												argsParallel={selectedSubset?.workflowtask_dump.args_parallel}
											/>
										{/key}
									{/if}
								</div>
							</div>
						{:else if workflowTabContextId === 1}
							<div id="meta-tab" class="tab-pane show active">
								<div class="card-body p-0">
									{#if selectedWorkflowTask}
										{#key selectedWorkflowTask}
											<MetaPropertiesForm
												{onWorkflowTaskUpdated}
												workflowTask={selectedWorkflowTask}
												bind:this={metaPropertiesForm}
												metaNonParallel={selectedSubset?.workflowtask_dump.meta_non_parallel}
												metaParallel={selectedSubset?.workflowtask_dump.meta_parallel}
												editable={!selectedSubset}
											/>
										{/key}
									{/if}
								</div>
							</div>
						{:else if workflowTabContextId === 2}
							<div id="info-tab" class="tab-pane show active">
								<div class="card-body">
									{#if selectedWorkflowTask}
										<TaskInfoTab
											task={selectedWorkflowTask.task}
											taskVersion={tasksVersions[selectedWorkflowTask.task.id]}
										/>
									{/if}
								</div>
							</div>
						{:else if workflowTabContextId === 3}
							{#if selectedWorkflowTask}
								<InputFiltersTab
									{workflow}
									workflowTask={selectedWorkflowTask}
									updateWorkflowTaskCallback={onInputFiltersUpdated}
									{selectedDatasetId}
									bind:this={inputFiltersTab}
								/>
							{/if}
						{/if}
						<div
							id="version-tab"
							class="tab-pane"
							class:show={workflowTabContextId === 4}
							class:active={workflowTabContextId === 4}
						>
							<div class="card-body">
								{#if selectedWorkflowTask}
									<VersionUpdate
										workflowTask={selectedWorkflowTask}
										updateWorkflowCallback={taskUpdated}
										{updateNewVersionsCount}
									/>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<AddWorkflowTaskModal
	bind:this={addWorkflowTaskModal}
	{onWorkflowTaskAdded}
	{workflow}
	user={$page.data.user}
/>

<ImagesStatusModal bind:this={imagesStatusModal} />

<Modal id="editWorkflowModal" centered={true} bind:this={editWorkflowModal}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Workflow properties</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-editWorkflowModal" />
		{#if workflow}
			<form id="updateWorkflow" on:submit|preventDefault={handleWorkflowUpdate}>
				<div class="mb-3">
					<label for="workflowName" class="form-label">Workflow name</label>
					<input
						type="text"
						class="form-control"
						name="workflowName"
						id="workflowName"
						bind:value={updatedWorkflowName}
					/>
				</div>
			</form>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-primary" form="updateWorkflow" disabled={workflowUpdating}>
			{#if workflowUpdating}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
			{/if}
			Save
		</button>
	</svelte:fragment>
</Modal>

<TasksOrderModal
	projectId={project.id}
	{workflow}
	workflowUpdater={(updated) => (workflow = updated)}
	bind:this={editTasksOrderModal}
/>

<RunWorkflowModal
	{workflow}
	datasets={sortedDatasets}
	{selectedDatasetId}
	{onJobSubmitted}
	{statuses}
	{attributeFiltersEnabled}
	onDatasetsUpdated={(updatedDatasets, newSelectedDatasetId) => {
		datasets = updatedDatasets;
		selectedDatasetId = newSelectedDatasetId;
	}}
	bind:this={runWorkflowModal}
/>

<Modal id="args-changes-unsaved-dialog" bind:this={argsUnsavedChangesModal}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">There are argument changes unsaved</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<p>
			Do you want to save the changes made to the arguments of the current selected workflow task?
		</p>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button
			type="button"
			class="btn btn-warning"
			on:click={async () => {
				argsSchemaForm?.discardChanges();
				await setSelectedWorkflowTask(preventedSelectedTaskChange);
				await selectSubset(preventedSelectedSubsetChange);
				argsUnsavedChangesModal.hide();
			}}
		>
			Discard changes
		</button>
		<button
			type="button"
			class="btn btn-success"
			on:click={async () => {
				await argsSchemaForm?.saveChanges();
				argsUnsavedChangesModal.hide();
			}}
		>
			Save changes
		</button>
	</svelte:fragment>
</Modal>

<Modal id="filters-changes-unsaved-dialog" bind:this={filtersUnsavedChangesModal}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">There are filter changes unsaved</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<p>
			Do you want to save the changes made to the filters of the current selected workflow task?
		</p>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button
			type="button"
			class="btn btn-warning"
			on:click={async () => {
				inputFiltersTab?.discardChanges();
				await setSelectedWorkflowTask(preventedSelectedTaskChange);
				await selectSubset(preventedSelectedSubsetChange);
				filtersUnsavedChangesModal.hide();
			}}
		>
			Discard changes
		</button>
		<button
			type="button"
			class="btn btn-success"
			on:click={async () => {
				await inputFiltersTab?.save();
				filtersUnsavedChangesModal.hide();
			}}
		>
			Save changes
		</button>
	</svelte:fragment>
</Modal>

<Modal id="meta-properties-changes-unsaved-dialog" bind:this={metaPropertiesUnsavedChangesModal}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">There are meta properties changes unsaved</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<p>
			Do you want to save the changes made to the meta properties of the current selected workflow
			task?
		</p>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button
			type="button"
			class="btn btn-warning"
			on:click={async () => {
				metaPropertiesForm?.discardChanges();
				await setSelectedWorkflowTask(preventedSelectedTaskChange);
				await selectSubset(preventedSelectedSubsetChange);
				metaPropertiesUnsavedChangesModal.hide();
			}}
		>
			Discard changes
		</button>
		<button
			type="button"
			class="btn btn-success"
			on:click={async () => {
				await metaPropertiesForm?.saveChanges();
				metaPropertiesUnsavedChangesModal.hide();
			}}
		>
			Save changes
		</button>
	</svelte:fragment>
</Modal>

<JobLogsModal bind:this={jobLogsModal} />

<style>
	.subset-item {
		padding-left: 38px;
	}
	.subset-item.active {
		background-color: #4e95ff !important;
	}
</style>
