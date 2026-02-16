<script>
	import { env } from '$env/dynamic/public';
	import { onDestroy, onMount, tick } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import MetaPropertiesForm from '$lib/components/v2/workflow/MetaPropertiesForm.svelte';
	import ArgumentsSchema from '$lib/components/v2/workflow/ArgumentsSchema.svelte';
	import {
		displayStandardErrorAlert,
		FormErrorHandler,
		getAlertErrorFromResponse
	} from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import VersionUpdate from '$lib/components/v2/workflow/VersionUpdate.svelte';
	import ImagesStatus from '$lib/components/jobs/ImagesStatus.svelte';
	import TasksOrderModal from '$lib/components/v2/workflow/TasksOrderModal.svelte';
	import { extractRelevantJobError, showExecutorErrorLog } from '$lib/common/job_utilities';
	import JobLogsModal from '$lib/components/v2/jobs/JobLogsModal.svelte';
	import WorkflowTaskInfoTab from '$lib/components/v2/workflow/WorkflowTaskInfoTab.svelte';
	import InputFiltersTab from '$lib/components/v2/workflow/InputFiltersTab.svelte';
	import RunWorkflowModal from '$lib/components/v2/workflow/RunWorkflowModal.svelte';
	import { getSelectedWorkflowDataset, saveSelectedDataset } from '$lib/common/workflow_utilities';
	import AddWorkflowTaskModal from '$lib/components/v2/workflow/AddWorkflowTaskModal.svelte';
	import TypeFiltersFlowModal from '$lib/components/v2/workflow/TypeFiltersFlowModal.svelte';
	import { slide } from 'svelte/transition';
	import ImagesStatusModal from '$lib/components/jobs/ImagesStatusModal.svelte';
	import RunStatus from '$lib/components/jobs/RunStatus.svelte';
	import RunStatusModal from '$lib/components/jobs/RunStatusModal.svelte';
	import { navigating, navigationCancelled } from '$lib/stores';
	import { writable } from 'svelte/store';
	import TimestampCell from '$lib/components/jobs/TimestampCell.svelte';
	import { normalizePayload } from 'fractal-components';

	const maxDescriptionLength = 50;
	const descriptionLengthOffset = 10;

	/** @type {number|undefined} */
	const defaultDatasetId = $derived(page.data.defaultDatasetId);

	/** @type {import('fractal-components/types/api').WorkflowV2} */
	let workflow = $state(page.data.workflow);
	let project = $derived(workflow.project);
	/** @type {import('fractal-components/types/api').DatasetV2[]} */
	let datasets = $state(page.data.datasets);

	/** @type {number|undefined} */
	let selectedDatasetId = $state();
	let selectedDataset = $derived(datasets.find((d) => d.id === selectedDatasetId));

	let showMissingStatusesWarning = $state(false);

	let jobError = $state('');
	/** @type {import('fractal-components/types/api').ApplyWorkflowV2|undefined} */
	let failedJob = $state();
	/** @type {JobLogsModal|undefined} */
	let jobLogsModal = $state();

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let workflowErrorAlert = undefined;

	let workflowTabContextId = $state(0);
	let workflowSuccessMessage = $state('');
	/** @type {import('fractal-components/types/api').WorkflowTaskV2|undefined} */
	let selectedWorkflowTask = $state();
	/** @type {number|undefined} */
	let expandedWorkflowTaskId = $state();
	/** @type {import('fractal-components/types/api').WorkflowTaskV2|undefined} */
	let preventedSelectedTaskChange = $state();
	/** @type {import('fractal-components/types/api').HistoryRunAggregated|undefined} */
	let preventedHistoryRunChange = $state();
	/** @type {import('fractal-components/types/api').HistoryRunAggregated[]} */
	let historyRunStatuses = $state([]);
	let loadingHistoryRunStatuses = $state(false);
	/** @type {ImagesStatusModal|undefined} */
	let imagesStatusModal = $state();
	/** @type {RunStatusModal|undefined} */
	let runStatusModal = $state();
	/** @type {import('fractal-components/types/api').HistoryRunAggregated|undefined} */
	let selectedHistoryRun = $state();

	/** @type {ArgumentsSchema|undefined} */
	let argsSchemaForm = $state();
	/** @type {MetaPropertiesForm|undefined} */
	let metaPropertiesForm = $state();

	let argsChangesSaved = $state(false);

	/** @type {InputFiltersTab|undefined} */
	let inputFiltersTab = $state();

	// Update workflow modal
	let updatedWorkflowName = $state('');
	let updatedWorkflowDescription = $state('');

	// Modals
	/** @type {Modal|undefined} */
	let argsUnsavedChangesModal = $state();
	/** @type {Modal|undefined} */
	let filtersUnsavedChangesModal = $state();
	/** @type {Modal|undefined} */
	let metaPropertiesUnsavedChangesModal = $state();
	/** @type {RunWorkflowModal|undefined} */
	let runWorkflowModal = $state();
	/** @type {import('$lib/components/v2/workflow/TasksOrderModal.svelte').default|undefined} */
	let editTasksOrderModal = $state();
	/** @type {AddWorkflowTaskModal|undefined} */
	let addWorkflowTaskModal = $state();
	/** @type {Modal|undefined} */
	let editWorkflowModal = $state();
	/** @type {TypeFiltersFlowModal|undefined} */
	let typeFiltersFlowModal = $state();

	/** @type {{ [id: string]: Array<{ task_id: number, version: string }> }} */
	let newVersionsMap = $state({});

	/** @type {import('fractal-components/types/api').ApplyWorkflowV2|undefined} */
	let selectedSubmittedJob = $state();
	let jobCancelledMessage = $state('');

	let expandWorkflowDescription = $state(false);

	const workflowPropsErrorHandler = new FormErrorHandler('errorAlert-editWorkflowModal', [
		'name',
		'description'
	]);
	const workflowPropsValidationErrors = workflowPropsErrorHandler.getValidationErrorStore();

	let updatableWorkflowList = $derived(workflow.task_list || []);

	let sortedDatasets = $derived(
		[...datasets].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
	);

	const updateJobsInterval = env.PUBLIC_UPDATE_JOBS_INTERVAL
		? parseInt(env.PUBLIC_UPDATE_JOBS_INTERVAL)
		: 3000;

	onMount(async () => {
		selectedDatasetId = getSelectedWorkflowDataset(workflow, datasets, defaultDatasetId);
		await loadJobsStatus();
		await checkNewVersions();
	});

	beforeNavigate(async (navigation) => {
		if (argsSchemaForm?.hasUnsavedChanges()) {
			preventNavigation(navigation);
			toggleArgsUnsavedChangesModal();
		}

		if (inputFiltersTab?.hasUnsavedChanges()) {
			preventNavigation(navigation);
			toggleFiltersUnsavedChangesModal();
		}

		if (metaPropertiesForm?.hasUnsavedChanges()) {
			preventNavigation(navigation);
			toggleMetaPropertiesUnsavedChangesModal();
		}
	});

	/**
	 *
	 * @param {import('@sveltejs/kit').BeforeNavigate} navigation
	 */
	function preventNavigation(navigation) {
		navigation.cancel();
		navigationCancelled.set(true);
		navigating.set(false);
	}

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
		updatedWorkflowDescription = workflow.description || '';
	}

	let workflowUpdating = $state(false);

	/**
	 * Updates a project's workflow in the server
	 * @returns {Promise<void>}
	 */
	async function handleWorkflowUpdate() {
		workflowSuccessMessage = '';
		workflowPropsErrorHandler.clearErrors();

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
			body: normalizePayload(
				{
					name: updatedWorkflowName,
					description: updatedWorkflowDescription
				},
				{ nullifyEmptyStrings: true }
			)
		});

		if (response.ok) {
			workflow = await response.json();
			workflowSuccessMessage = 'Workflow updated correctly';
			editWorkflowModal?.hide();
		} else {
			console.error('Error updating workflow properties');
			await workflowPropsErrorHandler.handleErrorResponse(response);
		}

		workflowUpdating = false;
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
		selectedHistoryRun = undefined;
		await tick();
		await inputFiltersTab?.init();
	}

	/**
	 * @param {import('fractal-components/types/api').HistoryRunAggregated|undefined} historyRun
	 */
	async function selectHistoryRun(historyRun) {
		await tick();
		preventedHistoryRunChange = historyRun;
		if (checkUnsavedChanges()) {
			return;
		}
		preventedHistoryRunChange = undefined;
		selectedHistoryRun = historyRun;
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
	async function loadHistoryRunStatuses(workflowTaskId, animate = true) {
		historyRunStatuses = [];
		expandedWorkflowTaskId = workflowTaskId;
		loadingHistoryRunStatuses = animate;
		const response = await fetch(
			`/api/v2/project/${workflow.project_id}/status/run?workflowtask_id=${workflowTaskId}&dataset_id=${selectedDatasetId}`
		);
		if (!response.ok) {
			loadingHistoryRunStatuses = false;
			return;
		}
		historyRunStatuses = await response.json();
		if (animate) {
			await tick(); // to trigger animation
		}
		loadingHistoryRunStatuses = false;
	}

	function toggleArgsUnsavedChangesModal() {
		argsUnsavedChangesModal?.toggle();
	}

	function toggleFiltersUnsavedChangesModal() {
		filtersUnsavedChangesModal?.toggle();
	}

	function toggleMetaPropertiesUnsavedChangesModal() {
		metaPropertiesUnsavedChangesModal?.toggle();
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
			runWorkflowModal?.open(action);
		}
	}

	/**
	 *
	 * @param {import('fractal-components/types/api').ApplyWorkflowV2} job
	 */
	async function onJobSubmitted(job) {
		selectedSubmittedJob = job;
		selectedHistoryRun = undefined;
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
		if (!workflow) {
			return;
		}
		newVersionsMap = await getNewVersionsForWorkflow(workflow);
	}

	/**
	 * @param {import('fractal-components/types/api').WorkflowV2} workflow
	 * @returns {Promise<{ [id: string]: Array<{ task_id: number, version: string }> }>}
	 */
	async function getNewVersionsForWorkflow(workflow) {
		const response = await fetch(
			`/api/v2/project/${workflow.project_id}/workflow/${workflow.id}/version-update-candidates`
		);

		/** @type {Array<Array<{ task_id: number, version: string }>>} */
		const updates = await response.json();

		/** @type {{ [id: string]: Array<{ task_id: number, version: string }> }} */
		const updateCandidates = {};

		for (let i = 0; i < updates.length; i++) {
			const task = workflow.task_list[i].task;
			updateCandidates[task.id] = updates[i];
		}

		return updateCandidates;
	}

	const newVersionsCount = writable(0);

	/** @type {{[key: number]: import('fractal-components/types/api').ImagesStatus}} */
	let statuses = $state({});

	let hasAnyJobRun = $derived(Object.keys(statuses).length > 0);

	let runningTaskId = $derived(
		workflow.task_list.find((t) => statuses[t.id]?.status === 'submitted')?.id
	);

	/** @type {number|undefined} */
	let statusWatcherTimer;

	async function selectedDatasetChanged() {
		expandedWorkflowTaskId = undefined;
		showMissingStatusesWarning = false;
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
		if (!statusResponse.ok) {
			console.error('Error retrieving images status');
			return;
		}
		const receivedStatuses = await statusResponse.json();

		if (selectedSubmittedJob && selectedSubmittedJob.status === 'failed') {
			failedJob = { ...selectedSubmittedJob };
			jobError = extractRelevantJobError(selectedSubmittedJob.log || '', 5);
		} else {
			failedJob = undefined;
			jobError = '';
		}

		statuses = Object.fromEntries(Object.entries(receivedStatuses).filter(([, v]) => v !== null));
		showMissingStatusesWarning = !!selectedSubmittedJob && Object.keys(statuses).length === 0;
		const submitted = Object.values(statuses).filter((s) => s.status === 'submitted');
		if (submitted.length > 0 || selectedSubmittedJob?.status === 'submitted') {
			window.clearTimeout(statusWatcherTimer);
			// if there are no null statuses and no submitted statuses the job is completed,
			// so we can reload the latest job immediately, otherwise wait default timeout
			const allCompleted =
				Object.entries(receivedStatuses).length === Object.values(statuses).length &&
				submitted.length === 0;
			statusWatcherTimer = window.setTimeout(loadJobsStatus, allCompleted ? 0 : updateJobsInterval);
		} else {
			await reloadSelectedDataset();
			selectedSubmittedJob = undefined;
			// reload run statuses, if one task is expanded
			if (expandedWorkflowTaskId !== undefined) {
				loadHistoryRunStatuses(expandedWorkflowTaskId, false);
			}
		}
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

	function showJobLogsModal() {
		if (!failedJob) {
			return;
		}
		jobLogsModal?.show(failedJob, false);
	}

	/**
	 * @param {number} datasetId
	 * @return {Promise<import('fractal-components/types/api').ApplyWorkflowV2|undefined>}
	 */
	async function getSelectedJob(datasetId) {
		const submitted = Object.values(statuses).filter((s) => s.status === 'submitted');
		if (
			submitted.length > 0 &&
			selectedSubmittedJob &&
			selectedSubmittedJob.dataset_id === datasetId
		) {
			return selectedSubmittedJob;
		}
		const response = await fetch(
			`/api/v2/project/${project.id}/latest-job?workflow_id=${workflow.id}&dataset_id=${datasetId}`
		);
		if (response.ok) {
			/** @type {import('fractal-components/types/api').ApplyWorkflowV2} */
			return await response.json();
		} else if (response.status !== 404) {
			console.error('Unable to load latest job');
		}
		return undefined;
	}

	async function stopWorkflow() {
		jobCancelledMessage = '';
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
			jobCancelledMessage = 'Job cancellation request received. The job will stop in a few seconds';
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

<div class="container mt-3 d-flex">
	<nav aria-label="breadcrumb" class="flex-grow-1">
		<ol class="breadcrumb">
			<li class="breadcrumb-item" aria-current="page">
				<a href="/v2/projects">Projects</a>
			</li>
			{#if page.params.projectId}
				<li class="breadcrumb-item" aria-current="page">
					<a href="/v2/projects/{page.params.projectId}">{project?.name}</a>
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

<div class="container">
	{#if workflow.description}
		<div class="mb-3">
			{#if workflow.description.length > maxDescriptionLength + descriptionLengthOffset}
				{#if expandWorkflowDescription}
					{workflow.description}
				{:else}
					{workflow.description.substring(0, maxDescriptionLength)}...
				{/if}
				{#if expandWorkflowDescription}
					<button
						class="btn btn-link fw-light p-0 mb-2"
						onclick={() => (expandWorkflowDescription = false)}
					>
						Show less
					</button>
				{:else}
					<button
						class="btn btn-link fw-light p-0 mb-2"
						onclick={() => (expandWorkflowDescription = true)}
					>
						Show more
					</button>
				{/if}
			{:else}
				{workflow.description}
			{/if}
			{#if workflow.description.length <= maxDescriptionLength + descriptionLengthOffset || expandWorkflowDescription}
				<button
					class="btn btn-link p-0 mb-2 ms-2"
					data-bs-toggle="modal"
					data-bs-target="#editWorkflowModal"
					aria-label="Edit description"
					onclick={async () => {
						resetWorkflowUpdateModal();
						await tick();
						document.getElementById('workflowDescription')?.focus();
					}}
				>
					<i class="bi bi-pencil"></i>
				</button>
			{/if}
		</div>
	{/if}

	<div class="row">
		<div class="col-lg-8">
			<div class="row">
				<div class="col-lg-4 col-md-6">
					<div class="input-group mb-3">
						<label for="dataset" class="input-group-text">Dataset</label>
						<select
							class="form-select"
							id="dataset"
							bind:value={selectedDatasetId}
							onchange={selectedDatasetChanged}
						>
							<option value={undefined}>Select...</option>
							{#each sortedDatasets as dataset (dataset.id)}
								<option value={dataset.id}>{dataset.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="col-lg-8 col-md-12">
					{#if selectedSubmittedJob && selectedSubmittedJob.status === 'submitted'}
						<button class="btn btn-danger" onclick={stopWorkflow}>
							<i class="bi-stop-circle-fill"></i> Stop workflow
						</button>
					{:else if !hasAnyJobRun}
						<button
							class="btn btn-success"
							onclick={() => openRunWorkflowModal('run')}
							type="button"
							disabled={selectedDatasetId === undefined || workflow.task_list.length === 0}
						>
							<i class="bi-play-fill"></i> Run workflow
						</button>
					{:else}
						<div class="d-flex mb-2">
							<div>
								<button
									class="btn btn-success mb-1"
									onclick={() => openRunWorkflowModal('continue')}
									type="button"
									disabled={workflow.task_list.length === 0}
								>
									<i class="bi-play-fill"></i> Continue workflow
								</button>
								<button
									class="btn btn-warning ms-1 mb-1"
									onclick={() => openRunWorkflowModal('restart')}
									type="button"
									disabled={workflow.task_list.length === 0}
								>
									<i class="bi bi-exclamation-diamond"></i> Reset workflow
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="col-lg-4 mb-2">
			<div class="float-end">
				{#if page.data.userInfo.is_superuser}
					<button
						class="btn btn-light"
						onclick={(e) => {
							e.preventDefault();
							typeFiltersFlowModal?.open();
						}}
						disabled={workflow.task_list.length === 0}
					>
						Type filters flow
					</button>
				{/if}
				<a
					href="/v2/projects/{project?.id}/workflows/{workflow?.id}/jobs{selectedDataset
						? '?dataset=' + selectedDataset.id
						: ''}"
					class="btn btn-light"
				>
					<i class="bi-journal-code"></i> List jobs
				</a>
				<button
					class="btn btn-light"
					onclick={(e) => {
						e.preventDefault();
						handleExportWorkflow();
					}}
					aria-label="Export workflow"
				>
					<i class="bi-download"></i>
				</button>
				<a id="downloadWorkflowButton" class="d-none">Download workflow link</a>
				<button
					class="btn btn-light"
					data-bs-toggle="modal"
					data-bs-target="#editWorkflowModal"
					onclick={resetWorkflowUpdateModal}
					aria-label="Edit workflow"
				>
					<i class="bi-pencil"></i>
				</button>
			</div>
		</div>
	</div>
</div>

<TypeFiltersFlowModal {workflow} bind:this={typeFiltersFlowModal} />

{#if workflow}
	<div class="container">
		<StandardDismissableAlert message={jobCancelledMessage} />
		<StandardDismissableAlert message={workflowSuccessMessage} />

		<div id="workflowErrorAlert"></div>

		{#if jobError}
			<div class="alert border border-danger bg-light">
				<div class="row">
					<div class="col-md-10 col-sm-9">
						<div class="text-muted mb-2 fw-bolder">
							The last job failed with the following error:
						</div>
						{#if failedJob && showExecutorErrorLog(failedJob)}
							<pre class="text-danger mb-0">{failedJob.executor_error_log}</pre>
						{:else}
							<pre class="text-danger mb-0">{jobError}</pre>
						{/if}
					</div>
					<div class="col-md-2 col-sm-3">
						<button class="btn btn-outline-secondary float-end" onclick={showJobLogsModal}>
							Show complete log
						</button>
					</div>
				</div>
			</div>
		{/if}

		{#if showMissingStatusesWarning}
			<div class="row">
				<div class="col">
					<div class="alert alert-warning">
						Some jobs ran for this workflow and dataset, but no information is available about the
						tasks' execution statuses. Possible reasons include: (1) All jobs ran with an old
						Fractal version (before v2.14, which has been available since May 2025), or (2) a
						job-execution error took place before the first task started running.
						<br>
						If you need to review what jobs already ran, have a look at the
						<a href="/v2/projects/{project.id}/workflows/{workflow.id}/jobs">job list</a>.
					</div>
				</div>
			</div>
		{/if}

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
									onclick={() => {
										workflowSuccessMessage = '';
										addWorkflowTaskModal?.show();
									}}
								>
									<i class="bi-plus-lg"></i>
								</button>
								<button
									class="btn btn-light"
									aria-label="Edit tasks order"
									onclick={() => editTasksOrderModal?.show(updatableWorkflowList)}
								>
									<i class="bi-arrow-down-up"></i>
								</button>
							</div>
						</div>
					</div>

					{#if workflow.task_list.length == 0}
						<p class="text-center mt-3">No workflow tasks yet, add one.</p>
					{:else}
						<div class="list-group list-group-flush" data-testid="workflow-tasks-list">
							{#each workflow.task_list as workflowTask (workflowTask.id)}
								<button
									style="cursor: pointer"
									class="list-group-item list-group-item-action"
									class:active={selectedWorkflowTask !== undefined &&
										selectedWorkflowTask.id === workflowTask.id}
									data-fs-target={workflowTask.id}
									onclick={(e) => {
										e.preventDefault();
										setSelectedWorkflowTask(workflowTask);
									}}
								>
									{#if statuses[workflowTask.id]}
										{#if expandedWorkflowTaskId === workflowTask.id && loadingHistoryRunStatuses}
											<span
												class="spinner-border spinner-border-sm p-0"
												role="status"
												aria-hidden="true"
											></span>
										{:else if expandedWorkflowTaskId === workflowTask.id}
											<!-- svelte-ignore node_invalid_placement_ssr -->
											<button
												aria-label="Hide runs"
												class="btn btn-link p-0 text-white"
												onclick={() => (expandedWorkflowTaskId = undefined)}
											>
												<i class="bi bi-caret-down-fill"></i>
											</button>
										{:else}
											<!-- svelte-ignore node_invalid_placement_ssr -->
											<button
												aria-label="Show runs"
												class="btn btn-link p-0"
												class:text-white={selectedWorkflowTask?.id === workflowTask.id}
												onclick={() => loadHistoryRunStatuses(workflowTask.id)}
											>
												<i class="bi bi-caret-right-fill"></i>
											</button>
										{/if}
									{/if}
									{workflowTask.alias ? workflowTask.alias : workflowTask.task.name}
									<span class="float-end ps-2">
										{#if selectedDataset}
											{#if !showMissingStatusesWarning && imagesStatusModal}
												<ImagesStatus
													status={statuses[workflowTask.id]}
													dataset={selectedDataset}
													{workflowTask}
													{imagesStatusModal}
													running={workflowTask.id === runningTaskId}
												/>
											{/if}
										{/if}
									</span>
									{#if newVersionsMap[workflowTask.task.id]?.length > 0}
										<span class="float-end text-info" title="new version available">
											<i class="bi bi-arrow-up-circle-fill"></i>
										</span>
									{/if}
									{#if workflowTask.warning}
										<span class="float-end text-warning" title={workflowTask.warning}>
											<i class="bi bi-exclamation-triangle-fill"></i>
										</span>
									{/if}
								</button>
								{#each historyRunStatuses as status, index (status.id)}
									{#if !loadingHistoryRunStatuses && expandedWorkflowTaskId === workflowTask.id}
										<button
											transition:slide
											class="run-item list-group-item list-group-item-action"
											class:active={selectedHistoryRun && selectedHistoryRun.id === status.id}
											style="padding-left: 38px"
											onclick={() => selectHistoryRun(status)}
										>
											Run {index + 1}
											<span class="float-end ps-2">
												{#if selectedDataset && runStatusModal}
													<RunStatus
														run={status}
														index={index + 1}
														{runStatusModal}
														{workflowTask}
														dataset={selectedDataset}
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
						<i class="bi bi-exclamation-triangle-fill"></i>
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
											onclick={() => setWorkflowTabContextId(0)}
											aria-current={workflowTabContextId === 0}
										>
											Arguments
										</button>
									</li>
									<li class="nav-item">
										<button
											class="nav-link {workflowTabContextId === 1 ? 'active' : ''}"
											onclick={() => setWorkflowTabContextId(1)}
											aria-current={workflowTabContextId === 1}
										>
											Meta
										</button>
									</li>
									{#if selectedHistoryRun}
										<li>
											<button
												class="nav-link {workflowTabContextId === 2 ? 'active' : ''}"
												onclick={() => setWorkflowTabContextId(2)}
												aria-current={workflowTabContextId === 2}
											>
												Run
											</button>
										</li>
									{/if}
									<li class="nav-item">
										<button
											class="nav-link {workflowTabContextId === 3 ? 'active' : ''}"
											onclick={() => setWorkflowTabContextId(3)}
											aria-current={workflowTabContextId === 3}
										>
											Info
										</button>
									</li>
									<li class="nav-item">
										<button
											class="nav-link {workflowTabContextId === 4 ? 'active' : ''}"
											onclick={() => setWorkflowTabContextId(4)}
											aria-current={workflowTabContextId === 4}
										>
											Types
										</button>
									</li>
									<li class="nav-item">
										<button
											class="nav-link {workflowTabContextId === 5 ? 'active' : ''}"
											onclick={() => setWorkflowTabContextId(5)}
											aria-current={workflowTabContextId === 5}
										>
											Version
											{#if $newVersionsCount}
												<span class="badge bg-primary rounded-pill">{$newVersionsCount}</span>
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
											{#if selectedHistoryRun}
												{#key selectedHistoryRun}
													<ArgumentsSchema
														bind:workflowTask={selectedWorkflowTask}
														{onWorkflowTaskUpdated}
														editable={false}
														bind:this={argsSchemaForm}
														argsSchemaNonParallel={selectedHistoryRun.args_schema_non_parallel}
														argsSchemaParallel={selectedHistoryRun.args_schema_parallel}
														argsNonParallel={selectedHistoryRun.workflowtask_dump.args_non_parallel}
														argsParallel={selectedHistoryRun.workflowtask_dump.args_parallel}
													/>
												{/key}
											{:else}
												<ArgumentsSchema
													bind:workflowTask={selectedWorkflowTask}
													{onWorkflowTaskUpdated}
													editable={true}
													bind:this={argsSchemaForm}
													argsSchemaNonParallel={selectedWorkflowTask.task.args_schema_non_parallel}
													argsSchemaParallel={selectedWorkflowTask.task.args_schema_parallel}
												/>
											{/if}
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
												metaNonParallel={selectedHistoryRun?.workflowtask_dump.meta_non_parallel}
												metaParallel={selectedHistoryRun?.workflowtask_dump.meta_parallel}
												editable={!selectedHistoryRun}
											/>
										{/key}
									{/if}
								</div>
							</div>
						{:else if workflowTabContextId === 2}
							<div id="run-tab" class="tab-pane show active">
								<div class="card-body">
									{#if selectedHistoryRun}
										<ul class="list-group">
											<li class="list-group-item list-group-item-light fw-bold">Started</li>
											<li class="list-group-item">
												<TimestampCell timestamp={selectedHistoryRun.timestamp_started} />
											</li>
											<li class="list-group-item list-group-item-light fw-bold">Version</li>
											<li class="list-group-item">{selectedHistoryRun.version || '-'}</li>
										</ul>
									{/if}
								</div>
							</div>
						{:else if workflowTabContextId === 3}
							<div id="info-tab" class="tab-pane show active">
								<div class="card-body">
									{#if selectedWorkflowTask}
										<WorkflowTaskInfoTab
											projectId={workflow.project_id}
											workflowTask={selectedWorkflowTask}
											updateWorkflowTaskCallback={(up) => {
												selectedWorkflowTask = up;
												workflow.task_list = workflow.task_list.map((wt) =>
													wt.id === up.id ? up : wt
												);
											}}
										/>
									{/if}
								</div>
							</div>
						{:else if workflowTabContextId === 4}
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
							class:show={workflowTabContextId === 5}
							class:active={workflowTabContextId === 5}
						>
							<div class="card-body">
								{#if selectedWorkflowTask}
									<VersionUpdate
										workflowTask={selectedWorkflowTask}
										updateWorkflowCallback={taskUpdated}
										updateCandidates={newVersionsMap[selectedWorkflowTask.task_id] || []}
										{newVersionsCount}
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

<AddWorkflowTaskModal bind:this={addWorkflowTaskModal} {onWorkflowTaskAdded} {workflow} />

<ImagesStatusModal bind:this={imagesStatusModal} />
<RunStatusModal bind:this={runStatusModal} />

<Modal id="editWorkflowModal" centered={true} bind:this={editWorkflowModal}>
	{#snippet header()}
		<h5 class="modal-title">Workflow properties</h5>
	{/snippet}
	{#snippet body()}
		{#if workflow}
			<form
				id="updateWorkflow"
				onsubmit={(e) => {
					e.preventDefault();
					handleWorkflowUpdate();
				}}
				class="has-validation"
			>
				<div class="mb-3">
					<label for="workflowName" class="form-label">Workflow name</label>
					<input
						type="text"
						class="form-control"
						class:is-invalid={$workflowPropsValidationErrors['name']}
						name="workflowName"
						id="workflowName"
						bind:value={updatedWorkflowName}
					/>
					<span class="invalid-feedback">{$workflowPropsValidationErrors['name']}</span>
				</div>
				<div class="mb-3">
					<label for="workflowDescription" class="form-label">Workflow description</label>
					<textarea
						class="form-control"
						class:is-invalid={$workflowPropsValidationErrors['description']}
						name="workflowDescription"
						id="workflowDescription"
						bind:value={updatedWorkflowDescription}
					></textarea>
					<span class="invalid-feedback">{$workflowPropsValidationErrors['description']}</span>
				</div>
			</form>
			<div id="errorAlert-editWorkflowModal"></div>
		{/if}
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-primary" form="updateWorkflow" disabled={workflowUpdating}>
			{#if workflowUpdating}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			{/if}
			Save
		</button>
	{/snippet}
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
	{selectedWorkflowTask}
	{onJobSubmitted}
	{statuses}
	onDatasetsUpdated={(updatedDatasets, newSelectedDatasetId) => {
		datasets = updatedDatasets;
		selectedDatasetId = newSelectedDatasetId;
	}}
	bind:this={runWorkflowModal}
/>

<Modal id="args-changes-unsaved-dialog" bind:this={argsUnsavedChangesModal}>
	{#snippet header()}
		<h5 class="modal-title">There are argument changes unsaved</h5>
	{/snippet}
	{#snippet body()}
		<p>
			Do you want to save the changes made to the arguments of the current selected workflow task?
		</p>
	{/snippet}
	{#snippet footer()}
		<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button
			type="button"
			class="btn btn-warning"
			onclick={async () => {
				argsSchemaForm?.discardChanges();
				await setSelectedWorkflowTask(preventedSelectedTaskChange);
				await selectHistoryRun(preventedHistoryRunChange);
				argsUnsavedChangesModal?.hide();
			}}
		>
			Discard changes
		</button>
		<button
			type="button"
			class="btn btn-success"
			onclick={async () => {
				await argsSchemaForm?.saveChanges();
				argsUnsavedChangesModal?.hide();
			}}
		>
			Save changes
		</button>
	{/snippet}
</Modal>

<Modal id="filters-changes-unsaved-dialog" bind:this={filtersUnsavedChangesModal}>
	{#snippet header()}
		<h5 class="modal-title">There are filter changes unsaved</h5>
	{/snippet}
	{#snippet body()}
		<p>
			Do you want to save the changes made to the filters of the current selected workflow task?
		</p>
	{/snippet}
	{#snippet footer()}
		<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button
			type="button"
			class="btn btn-warning"
			onclick={async () => {
				inputFiltersTab?.discardChanges();
				await setSelectedWorkflowTask(preventedSelectedTaskChange);
				await selectHistoryRun(preventedHistoryRunChange);
				filtersUnsavedChangesModal?.hide();
			}}
		>
			Discard changes
		</button>
		<button
			type="button"
			class="btn btn-success"
			onclick={async () => {
				await inputFiltersTab?.save();
				filtersUnsavedChangesModal?.hide();
			}}
		>
			Save changes
		</button>
	{/snippet}
</Modal>

<Modal id="meta-properties-changes-unsaved-dialog" bind:this={metaPropertiesUnsavedChangesModal}>
	{#snippet header()}
		<h5 class="modal-title">There are meta properties changes unsaved</h5>
	{/snippet}
	{#snippet body()}
		<p>
			Do you want to save the changes made to the meta properties of the current selected workflow
			task?
		</p>
	{/snippet}
	{#snippet footer()}
		<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button
			type="button"
			class="btn btn-warning"
			onclick={async () => {
				metaPropertiesForm?.discardChanges();
				await setSelectedWorkflowTask(preventedSelectedTaskChange);
				await selectHistoryRun(preventedHistoryRunChange);
				metaPropertiesUnsavedChangesModal?.hide();
			}}
		>
			Discard changes
		</button>
		<button
			type="button"
			class="btn btn-success"
			onclick={async () => {
				await metaPropertiesForm?.saveChanges();
				metaPropertiesUnsavedChangesModal?.hide();
			}}
		>
			Save changes
		</button>
	{/snippet}
</Modal>

<JobLogsModal bind:this={jobLogsModal} />

<style>
	.run-item {
		padding-left: 38px;
	}
	.run-item.active {
		background-color: #4e95ff !important;
	}

	:global(.status-icon) {
		font-size: 160%;
		font-weight: bold;
		margin: 0 -5px -5px -5px;
		line-height: 0;
		display: block;
	}

	:global(.active .status-wrapper),
	:global(.active .status-icon) {
		color: #fff !important;
	}

	:global(.status-modal-btn:hover span) {
		text-decoration: underline;
	}
</style>
