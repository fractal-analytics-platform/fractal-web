<script>
	import { replaceEmptyStrings } from '$lib/common/component_utilities';
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import {
		generateNewUniqueDatasetName,
		getFirstTaskIndexForContinuingWorkflow
	} from '$lib/common/job_utilities';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import { onMount, tick } from 'svelte';
	import DatasetImagesTable from '../projects/datasets/DatasetImagesTable.svelte';
	import { isConverterType } from 'fractal-components/common/workflow_task_utils';
	import {
		getRelativeZarrPath,
		getTypeFilterValues,
		STATUS_KEY
	} from '$lib/common/workflow_utilities';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').DatasetV2[]} datasets
	 * @property {import('fractal-components/types/api').WorkflowV2} workflow
	 * @property {number|undefined} selectedDatasetId
	 * @property {(job: import('fractal-components/types/api').ApplyWorkflowV2) => Promise<void>} onJobSubmitted
	 * @property {(updatedDatasets: import('fractal-components/types/api').DatasetV2[], newSelectedDatasetId: number) => void} onDatasetsUpdated
	 * @property {{[key: number]: import('fractal-components/types/api').ImagesStatus}} statuses
	 * @property {{[key: number]: import('fractal-components/types/api').JobStatus}} legacyStatuses
	 */

	/** @type {Props} */
	let {
		datasets,
		workflow,
		selectedDatasetId = $bindable(),
		onJobSubmitted,
		onDatasetsUpdated,
		statuses,
		legacyStatuses
	} = $props();

	/** @type {Modal|undefined} */
	let modal = $state();

	/** @type {DatasetImagesTable|undefined} */
	let datasetImagesTable = $state();

	let applyingWorkflow = $state(false);
	let checkingConfiguration = $state(false);
	let setSlurmAccount = $state(true);
	/** @type {string[]} */
	let slurmAccounts = $state([]);
	let slurmAccount = $state('');
	let workerInitControl = $state('');
	/** @type {number|undefined} */
	let firstTaskIndex = $state(undefined);
	/** @type {number|undefined} */
	let lastTaskIndex = $state(undefined);

	/** @type {string[]} */
	let preSubmissionCheckUniqueTypesResults = $state([]);
	let ignorePreSubmissionCheckUniqueTypes = $state(false);
	/** @type {string[]} */
	let preSubmissionCheckNotProcessedResults = $state([]);
	let ignorePreSubmissionCheckNotProcessed = $state(false);

	/** @type {'run'|'restart'|'continue'|undefined} */
	let mode = $state();
	let replaceExistingDataset = $state(true);

	let newDatasetName = $state('');

	/** @type {import('fractal-components/types/api').ImagePage|null} */
	let imagePage = $state(null);
	/** @type {string[]} */
	let extraTypes = $state([]);
	let hasImages = $state(false);
	/** @type {{ attribute_filters: { [key: string]: Array<string | number | boolean> | null }, type_filters: { [key: string]: boolean | null }} | null} */
	let initialFilterValues = $state(null);

	/**
	 * @param {'run'|'restart'|'continue'} action
	 */
	export async function open(action) {
		mode = action;
		replaceExistingDataset = true;
		applyingWorkflow = false;
		checkingConfiguration = false;
		preSubmissionCheckUniqueTypesResults = [];
		ignorePreSubmissionCheckUniqueTypes = false;
		preSubmissionCheckNotProcessedResults = [];
		ignorePreSubmissionCheckNotProcessed = false;
		workerInitControl = '';
		if (mode === 'run' || mode === 'restart') {
			firstTaskIndex = 0;
		} else {
			firstTaskIndex = getFirstTaskIndexForContinuingWorkflow(
				workflow.task_list,
				statuses,
				legacyStatuses
			);
		}
		lastTaskIndex = undefined;
		await loadDatasetImages();
		modal?.show();
	}

	/**
	 * Requests the server to apply a project's workflow (i.e. run it)
	 * @returns {Promise<void>}
	 */
	async function handleApplyWorkflow() {
		// reset previous errors
		modal?.hideErrorAlert();

		applyingWorkflow = true;
		if (mode === 'restart') {
			try {
				if (replaceExistingDataset) {
					await replaceDataset();
				} else {
					await createNewDataset();
				}
			} catch (err) {
				modal?.displayErrorAlert(err);
				applyingWorkflow = false;
				return;
			}
		}

		const requestBody = {
			worker_init: workerInitControl,
			first_task_index: firstTaskIndex,
			last_task_index: lastTaskIndex,
			attribute_filters: appliedAttributeFilters,
			type_filters: appliedTypeFilters
		};
		if (setSlurmAccount && slurmAccount !== '') {
			requestBody.slurm_account = slurmAccount;
		}

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(
			`/api/v2/project/${workflow.project_id}/job/submit?workflow_id=${workflow.id}&dataset_id=${selectedDatasetId}`,
			{
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify(requestBody, replaceEmptyStrings)
			}
		);
		applyingWorkflow = false;
		checkingConfiguration = false;

		// Handle API response
		if (response.ok) {
			// Successfully applied workflow
			modal?.toggle();
			const job = await response.json();
			await onJobSubmitted(job);
		} else {
			console.error(response);
			// Set an error message on the component
			modal?.displayErrorAlert(await response.json());
		}
	}

	async function replaceDataset() {
		const { id, name, zarr_dir } = /** @type {import('fractal-components/types/api').DatasetV2} */ (
			selectedDataset
		);
		await handleDatasetDelete(id);
		const newDatasets = datasets.filter((d) => d.id !== id);
		const newDataset = await handleDatasetCreate(name, zarr_dir);
		newDatasets.push(newDataset);
		onDatasetsUpdated(newDatasets, newDataset.id);
	}

	async function createNewDataset() {
		const { zarr_dir } = /** @type {import('fractal-components/types/api').DatasetV2} */ (
			selectedDataset
		);
		const newDataset = await handleDatasetCreate(newDatasetName, zarr_dir);
		onDatasetsUpdated([...datasets, newDataset], newDataset.id);
	}

	/**
	 * @param {string} datasetName
	 * @param {string} zarrDir
	 * @returns {Promise<import('fractal-components/types/api').DatasetV2>}
	 */
	async function handleDatasetCreate(datasetName, zarrDir) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/v2/project/${workflow.project_id}/dataset`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				name: datasetName,
				zarr_dir: zarrDir
			})
		});
		if (!response.ok) {
			console.log('Dataset creation failed');
			throw await getAlertErrorFromResponse(response);
		}
		return await response.json();
	}

	/**
	 * @param {number} datasetId
	 */
	async function handleDatasetDelete(datasetId) {
		const response = await fetch(`/api/v2/project/${workflow.project_id}/dataset/${datasetId}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (!response.ok) {
			console.error('Error while deleting dataset:');
			throw await getAlertErrorFromResponse(response);
		}
	}

	async function firstTaskIndexChanged() {
		preSubmissionCheckUniqueTypesResults = [];
		ignorePreSubmissionCheckUniqueTypes = false;
		await loadDatasetImages();
		// reset last task
		if (
			lastTaskIndex !== undefined &&
			firstTaskIndex !== undefined &&
			firstTaskIndex > lastTaskIndex
		) {
			lastTaskIndex = undefined;
		}
	}

	/** @type {{ [key: string]: Array<string | number | boolean> | null }} */
	let appliedAttributeFilters = $state({});
	/** @type {{ [key: string]: boolean }} */
	let appliedTypeFilters = $state({});

	async function showConfirmRun() {
		if (datasetImagesTable) {
			const params = await datasetImagesTable.applySearchFields();
			if (ignorePreSubmissionCheckUniqueTypes) {
				preSubmissionCheckUniqueTypesResults = [];
				ignorePreSubmissionCheckUniqueTypes = false;
			} else {
				const valid = await preSubmissionCheckUniqueTypes(params);
				if (!valid) {
					preSubmissionCheckNotProcessedResults = [];
					ignorePreSubmissionCheckNotProcessed = false;
					return;
				}
			}
			if (ignorePreSubmissionCheckNotProcessed) {
				preSubmissionCheckNotProcessedResults = [];
				ignorePreSubmissionCheckNotProcessed = false;
			} else {
				const valid = await preSubmissionCheckNotProcessed(params);
				if (!valid) {
					return;
				}
			}
		}
		const wft = workflow.task_list[firstTaskIndex || 0];
		if (mode === 'restart') {
			appliedTypeFilters = { ...wft.type_filters };
		} else {
			appliedTypeFilters = await getTypeFilterValues(workflow.project_id, wft);
			if (datasetImagesTable) {
				appliedAttributeFilters = datasetImagesTable.getAttributeFilters();
				appliedTypeFilters = datasetImagesTable.getTypeFilters();
			}
		}
		checkingConfiguration = true;
		modal?.restoreModalFocus();
	}

	/**
	 * @param {{ attribute_filters: any, type_filters: any }} params
	 */
	async function preSubmissionCheckUniqueTypes(params) {
		preSubmissionCheckUniqueTypesResults = [];
		const wft = workflow.task_list[firstTaskIndex || 0];
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/project/${workflow.project_id}/dataset/${selectedDatasetId}/images/verify-unique-types?workflowtask_id=${wft.id}`,
			{
				headers,
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify(params)
			}
		);
		if (!response.ok) {
			modal?.displayErrorAlert(await getAlertErrorFromResponse(response));
			return false;
		}
		/** @type {string[]} */
		preSubmissionCheckUniqueTypesResults = await response.json();
		const valid = preSubmissionCheckUniqueTypesResults.length === 0;
		if (!valid) {
			await scrollToWarningMessage('pre-submission-check-unique-types-warning');
		}
		return valid;
	}

	/**
	 * @param {{ attribute_filters: any, type_filters: any }} params
	 * @returns {Promise<boolean>}
	 */
	async function preSubmissionCheckNotProcessed(params) {
		preSubmissionCheckNotProcessedResults = [];
		const wft = workflow.task_list[firstTaskIndex || 0];
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/project/${workflow.project_id}/dataset/${selectedDatasetId}/images/non-processed?workflow_id=${workflow.id}&workflowtask_id=${wft.id}`,
			{
				headers,
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify(params)
			}
		);
		if (!response.ok) {
			modal?.displayErrorAlert(await getAlertErrorFromResponse(response));
			return false;
		}
		/** @type {string[]} */
		preSubmissionCheckNotProcessedResults = await response.json();
		const valid = preSubmissionCheckNotProcessedResults.length === 0;
		if (!valid) {
			await scrollToWarningMessage('pre-submission-check-not-processed-warning');
		}
		return valid;
	}

	/**
	 * @param {string} elementId
	 */
	async function scrollToWarningMessage(elementId) {
		await tick();
		const modalBody = document.querySelector('.modal.show .modal-body');
		const warningAlert = document.getElementById(elementId);
		if (modalBody && warningAlert) {
			const bodyRect = modalBody.getBoundingClientRect();
			const alertRect = warningAlert.getBoundingClientRect();
			const alertRelativeY = alertRect.y - bodyRect.y;
			modalBody.scrollTo({
				top: alertRelativeY + modalBody.scrollTop,
				behavior: 'smooth'
			});
		}
	}

	function computeNewDatasetName() {
		const dataset = /** @type {import('fractal-components/types/api').DatasetV2} */ (
			selectedDataset
		);
		newDatasetName = generateNewUniqueDatasetName(datasets, dataset.name);
	}

	async function loadSlurmAccounts() {
		const response = await fetch(`/api/auth/current-user/settings`, {
			method: 'GET',
			credentials: 'include'
		});
		const result = await response.json();
		if (response.ok) {
			slurmAccounts = result.slurm_accounts;
			slurmAccount = slurmAccounts.length === 0 ? '' : slurmAccounts[0];
		} else {
			console.error('Error while loading current user settings', result);
		}
	}

	let datasetImagesLoading = $state(false);

	async function loadDatasetImages() {
		if (firstTaskIndex === undefined) {
			return;
		}

		datasetImagesLoading = true;
		const workflowTask = workflow.task_list[firstTaskIndex];

		const dataset = /** @type {import('fractal-components/types/api').DatasetV2} */ (
			selectedDataset
		);

		const initialTypeFilters = await getTypeFilterValues(workflow.project_id, workflowTask);

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		initialFilterValues = {
			attribute_filters: {},
			type_filters: initialTypeFilters
		};
		const response = await fetch(
			`/api/v2/project/${dataset.project_id}/status/images?workflowtask_id=${workflowTask.id}&dataset_id=${dataset.id}&page=1&page_size=10`,
			{
				method: 'POST',
				headers,
				credentials: 'include',
				body: JSON.stringify(initialFilterValues)
			}
		);
		if (!response.ok) {
			modal?.displayErrorAlert(await getAlertErrorFromResponse(response));
			datasetImagesLoading = false;
			return;
		}
		const result = /** @type {import('fractal-components/types/api').ImagePage} */ (
			await response.json()
		);
		extraTypes = Object.keys(initialTypeFilters).filter((x) => !result.types.includes(x));
		imagePage = result;
		hasImages = imagePage.total_count > 0;
		if (!hasImages) {
			// Verify if dataset without filters has images
			const response = await fetch(
				`/api/v2/project/${dataset.project_id}/status/images?workflowtask_id=${workflowTask.id}&dataset_id=${dataset.id}&page=1&page_size=10`,
				{
					method: 'POST',
					headers,
					credentials: 'include',
					body: JSON.stringify({})
				}
			);
			if (!response.ok) {
				modal?.displayErrorAlert(await getAlertErrorFromResponse(response));
				datasetImagesLoading = false;
				return;
			}
			/** @type {import('fractal-components/types/api').ImagePage} */
			const result = await response.json();
			hasImages = result.total_count > 0;
		}
		datasetImagesLoading = false;
		await tick();
		await datasetImagesTable?.load(false);
	}

	/**
	 * @param {number} selectedIndex
	 * @returns {string|undefined}
	 */
	function getPreviousTaskName(selectedIndex) {
		if (selectedIndex === 0) {
			return undefined;
		}
		return workflow.task_list[selectedIndex - 1].task.name;
	}

	/**
	 * @param {string[]} paths
	 * @returns {string}
	 */
	function getNotProcessedImagesLabel(paths) {
		if (!selectedDataset) {
			return '';
		}
		paths = paths.map((p) => getRelativeZarrPath(selectedDataset, p));
		if (paths.length === 1) {
			return `Image ${paths[0]} was`;
		}
		if (paths.length <= 3) {
			return `Images ${paths.join(', ')} were`;
		}
		const firstThree = paths.slice(0, 3);
		return `Images ${firstThree.join(', ')} and ${paths.length - 3} others were`;
	}

	async function cancel() {
		checkingConfiguration = false;
		await tick();
		datasetImagesTable?.load();
	}

	onMount(async () => {
		mode = 'run';
		await loadSlurmAccounts();
	});

	const selectedDataset = $derived(datasets.find((d) => d.id === selectedDatasetId));
	const runBtnDisabled = $derived(
		(mode === 'restart' && !replaceExistingDataset && newDatasetName === selectedDataset?.name) ||
			(mode === 'continue' && firstTaskIndex === undefined)
	);
	const showImageList = $derived(
		hasImages &&
			firstTaskIndex !== undefined &&
			mode !== 'restart' &&
			workflow.task_list[firstTaskIndex] &&
			!isConverterType(workflow.task_list[firstTaskIndex].task_type)
	);
	const disabledTypes = $derived(
		Object.keys({
			...(workflow.task_list[firstTaskIndex || 0]?.type_filters || {}),
			...(workflow.task_list[firstTaskIndex || 0]?.task.input_types || {}),
			...extraTypes
		})
	);
</script>

<Modal
	id="runWorkflowModal"
	centered={true}
	bind:this={modal}
	size="xl"
	scrollable={true}
	focus={false}
>
	{#snippet header()}
		<h5 class="modal-title">
			{#if mode === 'run'}
				Run workflow
			{:else if mode === 'continue'}
				Continue workflow
			{:else}
				Restart workflow
			{/if}
		</h5>
	{/snippet}
	{#snippet body()}
		<div id="errorAlert-runWorkflowModal"></div>
		<form id="runWorkflowForm">
			{#if mode === 'restart'}
				<div class="alert alert-warning">
					<strong>WARNING</strong>: Restarting a workflow will create a new dataset and optionally
					delete the old dataset with its image list, filters & history. It does not remove the
					existing Zarr data though. Either remove it yourself before rerunning or set the overwrite
					option to True in the corresponding tasks.
				</div>
			{/if}
			{#if mode === 'restart'}
				<div class="mb-3">
					<div class="form-check">
						<input
							class="form-check-input"
							type="checkbox"
							id="replaceExistingDataset"
							bind:checked={replaceExistingDataset}
							onchange={computeNewDatasetName}
						/>
						<label class="form-check-label" for="replaceExistingDataset">
							Replace existing dataset
						</label>
					</div>
				</div>
			{/if}
			<div class="mb-3">
				<label for="run-workflow-dataset" class="form-label">
					{#if mode === 'restart'}
						Original dataset
					{:else}
						Dataset
					{/if}
				</label>
				<select
					id="run-workflow-dataset"
					class="form-select"
					disabled
					bind:value={selectedDatasetId}
				>
					<option value={undefined}>Select a dataset</option>
					{#each datasets as dataset (dataset.id)}
						<option value={dataset.id}>{dataset.name}</option>
					{/each}
				</select>
			</div>
			{#if mode === 'restart' && !replaceExistingDataset}
				<div class="mb-3 has-validation">
					<label for="newDatasetName" class="form-label">New dataset name</label>
					<input
						id="newDatasetName"
						class="form-control"
						type="text"
						bind:value={newDatasetName}
						disabled={checkingConfiguration}
						class:is-invalid={newDatasetName === selectedDataset?.name}
					/>
					<span class="invalid-feedback">
						The new dataset name must be different from the original dataset name
					</span>
				</div>
			{/if}
			<div class="row mb-3">
				<div class="col has-validation">
					<label for="firstTaskIndex" class="form-label"> Start workflow at </label>
					<select
						name="firstTaskIndex"
						id="firstTaskIndex"
						class="form-select"
						disabled={checkingConfiguration}
						bind:value={firstTaskIndex}
						onchange={firstTaskIndexChanged}
						class:is-invalid={mode === 'continue' && firstTaskIndex === undefined}
					>
						<option value={undefined}>Select first task</option>
						{#each workflow.task_list as wft (wft.id)}
							<option value={wft.order}>{wft.task.name}</option>
						{/each}
					</select>
					<span class="invalid-feedback"> The first task is required </span>
				</div>
				<div class="col">
					<label for="lastTaskIndex" class="form-label">(Optional) Stop workflow early</label>
					<select
						name="lastTaskIndex"
						id="lastTaskIndex"
						class="form-select"
						disabled={checkingConfiguration}
						bind:value={lastTaskIndex}
					>
						<option value={undefined}>Select last task</option>
						{#each workflow.task_list as wft (wft.id)}
							{#if firstTaskIndex === undefined || wft.order >= firstTaskIndex}
								<option value={wft.order}>{wft.task.name}</option>
							{/if}
						{/each}
					</select>
				</div>
			</div>
			<div class="accordion mb-2" id="accordion-run-workflow">
				{#if imagePage && selectedDataset && showImageList}
					<div class="accordion-item">
						<h2 class="accordion-header">
							<button
								class="accordion-button"
								type="button"
								data-bs-toggle="collapse"
								data-bs-target="#collapse-workflow-image-list"
								aria-expanded="false"
								aria-controls="collapse-workflow-image-list"
							>
								Image list
							</button>
						</h2>
						<div
							id="collapse-workflow-image-list"
							class="accordion-collapse collapse show"
							data-bs-parent="#accordion-run-workflow"
						>
							<div class="accordion-body">
								{#if preSubmissionCheckUniqueTypesResults.length > 0}
									<div
										class="alert alert-warning mb-0"
										id="pre-submission-check-unique-types-warning"
									>
										You are trying to run a workflow without specifying what type of images should
										be processed. Specify the relevant type filter to continue.
										<button
											type="button"
											class="btn btn-warning mt-1"
											onclick={() => {
												ignorePreSubmissionCheckUniqueTypes = true;
												showConfirmRun();
											}}
										>
											Continue anyway
										</button>
									</div>
								{/if}
								{#if preSubmissionCheckNotProcessedResults.length > 0}
									<div
										class="alert alert-warning mb-0"
										id="pre-submission-check-not-processed-warning"
									>
										You are trying to run the {workflow.task_list[firstTaskIndex || 0].task.name} task
										on images that were not run on the prior
										{getPreviousTaskName(firstTaskIndex || 0)} task.
										{getNotProcessedImagesLabel(preSubmissionCheckNotProcessedResults)}
										not run on the prior task.
										<button
											type="button"
											class="btn btn-warning mt-1"
											onclick={() => {
												ignorePreSubmissionCheckUniqueTypes = true;
												ignorePreSubmissionCheckNotProcessed = true;
												showConfirmRun();
											}}
										>
											Continue anyway
										</button>
									</div>
								{/if}
								{#if checkingConfiguration}
									This job will process {imagePage.total_count}
									{imagePage.total_count === 1 ? 'image' : 'images'}.
								{:else}
									<DatasetImagesTable
										bind:this={datasetImagesTable}
										dataset={selectedDataset}
										bind:imagePage
										{initialFilterValues}
										{disabledTypes}
										{extraTypes}
										highlightedTypes={preSubmissionCheckUniqueTypesResults}
										vizarrViewerUrl={null}
										runWorkflowModal={true}
										queryUrl={`/api/v2/project/${selectedDataset.project_id}/status/images?workflowtask_id=${workflow.task_list[firstTaskIndex || 0].id}&dataset_id=${selectedDataset.id}`}
										beforeTypeSelectionChanged={(key) => {
											preSubmissionCheckUniqueTypesResults =
												preSubmissionCheckUniqueTypesResults.filter((k) => k !== key);
										}}
									/>
								{/if}
							</div>
						</div>
					</div>
				{/if}
				{#if datasetImagesLoading}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
				{/if}
			</div>
			<div class="clearfix mb-1">
				<button
					class="btn btn-light float-end"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target="#collapseAdvancedOptions"
					aria-expanded="false"
					aria-controls="collapseAdvancedOptions"
				>
					Advanced options
				</button>
			</div>
			<div class="collapse clearfix" id="collapseAdvancedOptions">
				<div class="card card-body">
					<div class="mb-3">
						<label for="workerInit" class="form-label">Worker initialization (Optional)</label>
						<textarea
							name="workerInit"
							id="workerInit"
							class="form-control font-monospace"
							rows="5"
							disabled={checkingConfiguration}
							bind:value={workerInitControl}
						></textarea>
					</div>
					{#if slurmAccounts.length > 0}
						<div class="mb-3">
							<div class="form-check">
								<input
									class="form-check-input"
									type="checkbox"
									id="setSlurmAccount"
									bind:checked={setSlurmAccount}
								/>
								<label class="form-check-label" for="setSlurmAccount"> Set SLURM account </label>
							</div>
						</div>
						{#if setSlurmAccount}
							<div class="mb-3">
								<label for="slurmAccount" class="form-label">SLURM account</label>
								<select
									name="slurmAccount"
									id="slurmAccount"
									class="form-select"
									disabled={checkingConfiguration}
									bind:value={slurmAccount}
								>
									{#each slurmAccounts as account (account)}
										<option>{account}</option>
									{/each}
								</select>
							</div>
						{/if}
					{/if}
				</div>
			</div>
			{#if checkingConfiguration}
				<hr />
				<h6 class="mt-3">Applied filters</h6>
				{#if Object.entries(appliedAttributeFilters).length > 0 || Object.entries(appliedTypeFilters).length > 0}
					<p>
						Currently, the following filters are applied to the image list before it is passed to
						the first task:
					</p>
					<ul class="mb-0">
						{#each Object.entries(appliedAttributeFilters) as [key, value] (key)}
							<li>{key === STATUS_KEY ? 'Status' : key}: <code>{value}</code></li>
						{/each}
					</ul>
					<ul class="mt-0 mb-1">
						{#each Object.entries(appliedTypeFilters) as [key, value] (key)}
							<li>{key}: <BooleanIcon {value} /></li>
						{/each}
					</ul>
				{:else}
					<p class="mb-0">No filters</p>
				{/if}
			{/if}
		</form>
	{/snippet}
	{#snippet footer()}
		{#if checkingConfiguration}
			<button class="btn btn-warning" onclick={cancel}> Cancel </button>
			<button
				class="btn btn-primary"
				onclick={(e) => {
					e.preventDefault();
					handleApplyWorkflow();
				}}
				disabled={applyingWorkflow}
			>
				{#if applyingWorkflow}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
				{/if}
				Confirm
			</button>
		{:else}
			<button class="btn btn-primary" onclick={showConfirmRun} disabled={runBtnDisabled}>
				Run
			</button>
		{/if}
	{/snippet}
</Modal>

<style>
	:global(.boolean-icon) {
		vertical-align: top;
	}
</style>
