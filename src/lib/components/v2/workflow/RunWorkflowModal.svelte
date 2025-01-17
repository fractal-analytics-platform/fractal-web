<script>
	import { replaceEmptyStrings } from '$lib/common/component_utilities';
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import {
		generateNewUniqueDatasetName,
		getFirstTaskIndexForContinuingWorkflow
	} from '$lib/common/job_utilities';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import { onMount } from 'svelte';
	import DatasetImagesTable from '../projects/datasets/DatasetImagesTable.svelte';

	/** @type {import('fractal-components/types/api').DatasetV2[]} */
	export let datasets;
	/** @type {import('fractal-components/types/api').WorkflowV2} */
	export let workflow;
	/** @type {number|undefined} */
	export let selectedDatasetId;
	/** @type {(job: import('fractal-components/types/api').ApplyWorkflowV2) => Promise<void>} */
	export let onJobSubmitted;
	/** @type {(updatedDatasets: import('fractal-components/types/api').DatasetV2[], newSelectedDatasetId: number) => void} */
	export let onDatasetsUpdated;
	/** @type {{[key: number]: import('$lib/types').JobStatus}} */
	export let statuses;
	export let attributeFiltersEnabled;

	/** @type {Modal} */
	let modal;

	/** @type {DatasetImagesTable|undefined} */
	let datasetImagesTable;

	let applyingWorkflow = false;
	let checkingConfiguration = false;
	let setSlurmAccount = true;
	/** @type {string[]} */
	let slurmAccounts = [];
	let slurmAccount = '';
	let workerInitControl = '';
	/** @type {number|undefined} */
	let firstTaskIndex = undefined;
	/** @type {number|undefined} */
	let lastTaskIndex = undefined;

	/** @type {'run'|'restart'|'continue'} */
	let mode = 'run';
	let replaceExistingDataset = true;

	let newDatasetName = '';

	$: selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

	$: runBtnDisabled =
		(mode === 'restart' && !replaceExistingDataset && newDatasetName === selectedDataset?.name) ||
		(mode === 'continue' && firstTaskIndex === undefined);

	/** @type {import('fractal-components/types/api').ImagePage|null} */
	let imagePage = null;
	/** @type {{ attribute_filters: { [key: string]: Array<string | number | boolean> | null }, type_filters: { [key: string]: boolean | null }} | null} */
	let initialFilterValues = null;

	/**
	 * @param {'run'|'restart'|'continue'} action
	 */
	export async function open(action) {
		mode = action;
		replaceExistingDataset = true;
		applyingWorkflow = false;
		checkingConfiguration = false;
		workerInitControl = '';
		if (mode === 'run' || mode === 'restart') {
			firstTaskIndex = 0;
		} else {
			firstTaskIndex = getFirstTaskIndexForContinuingWorkflow(workflow.task_list, statuses);
		}
		lastTaskIndex = undefined;
		await loadDatasetImages();
		modal.show();
	}

	/**
	 * Requests the server to apply a project's workflow (i.e. run it)
	 * @returns {Promise<void>}
	 */
	async function handleApplyWorkflow() {
		// reset previous errors
		modal.hideErrorAlert();

		applyingWorkflow = true;
		if (mode === 'restart') {
			try {
				if (replaceExistingDataset) {
					await replaceDataset();
				} else {
					await createNewDataset();
				}
			} catch (err) {
				modal.displayErrorAlert(err);
				applyingWorkflow = false;
				return;
			}
		}

		const requestBody = {
			worker_init: workerInitControl,
			first_task_index: firstTaskIndex,
			last_task_index: lastTaskIndex,
			attribute_filters: appliedAttributeFilters
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
			modal.toggle();
			const job = await response.json();
			await onJobSubmitted(job);
		} else {
			console.error(response);
			// Set an error message on the component
			modal.displayErrorAlert(await response.json());
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
	let appliedAttributeFilters = {};
	/** @type {{ [key: string]: boolean }} */
	let appliedTypeFilters = {};

	function showConfirmRun() {
		const wft = workflow.task_list[firstTaskIndex || 0];
		if (mode === 'restart') {
			appliedAttributeFilters = { ...selectedDataset?.attribute_filters };
			appliedTypeFilters = { ...wft.type_filters };
		} else {
			const dataset = /** @type {import('fractal-components/types/api').DatasetV2} */ (
				selectedDataset
			);
			if (datasetImagesTable) {
				appliedAttributeFilters = datasetImagesTable.getAttributeFilters();
			} else {
				appliedAttributeFilters = { ...dataset.attribute_filters };
			}
			appliedTypeFilters = { ...dataset.type_filters, ...wft.type_filters };
		}
		checkingConfiguration = true;
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

	let datasetImagesLoading = false;

	async function loadDatasetImages() {
		if (firstTaskIndex === undefined) {
			return;
		}

		datasetImagesLoading = true;
		const task = workflow.task_list[firstTaskIndex];

		const dataset = /** @type {import('fractal-components/types/api').DatasetV2} */ (
			selectedDataset
		);

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		initialFilterValues = {
			attribute_filters: {
				...dataset.attribute_filters
			},
			type_filters: {
				...dataset.type_filters,
				...task.type_filters
			}
		};
		const response = await fetch(
			`/api/v2/project/${dataset.project_id}/dataset/${dataset.id}/images/query?page=1&page_size=10`,
			{
				method: 'POST',
				headers,
				credentials: 'include',
				body: JSON.stringify(initialFilterValues)
			}
		);
		if (response.ok) {
			imagePage = await response.json();
		}
		datasetImagesLoading = false;
	}

	onMount(async () => {
		await loadSlurmAccounts();
	});

	let opened = false;
</script>

<Modal
	id="runWorkflowModal"
	centered={true}
	bind:this={modal}
	size="xl"
	onOpen={() => (opened = true)}
	onClose={() => (opened = false)}
	scrollable={true}
>
	<svelte:fragment slot="header">
		<h5 class="modal-title">
			{#if mode === 'run'}
				Run workflow
			{:else if mode === 'continue'}
				Continue workflow
			{:else}
				Restart workflow
			{/if}
		</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-runWorkflowModal" />
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
							on:change={computeNewDatasetName}
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
					{#each datasets as dataset}
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
			<div class="mb-3 has-validation">
				<label for="firstTaskIndex" class="form-label">
					{#if mode === 'continue'}
						First task (Required)
					{:else}
						First task (Optional)
					{/if}
				</label>
				<select
					name="firstTaskIndex"
					id="firstTaskIndex"
					class="form-select"
					disabled={checkingConfiguration}
					bind:value={firstTaskIndex}
					on:change={firstTaskIndexChanged}
					class:is-invalid={mode === 'continue' && firstTaskIndex === undefined}
				>
					<option value={undefined}>Select first task</option>
					{#each workflow.task_list as wft}
						<option value={wft.order}>{wft.task.name}</option>
					{/each}
				</select>
				<span class="invalid-feedback"> The first task is required </span>
			</div>
			<div class="mb-3">
				<label for="lastTaskIndex" class="form-label">Last task (Optional)</label>
				<select
					name="lastTaskIndex"
					id="lastTaskIndex"
					class="form-select"
					disabled={checkingConfiguration}
					bind:value={lastTaskIndex}
				>
					<option value={undefined}>Select last task</option>
					{#each workflow.task_list as wft}
						{#if firstTaskIndex === undefined || wft.order >= firstTaskIndex}
							<option value={wft.order}>{wft.task.name}</option>
						{/if}
					{/each}
				</select>
			</div>
			{#key opened}
				<div class="accordion" id="accordion-run-workflow">
					<div class="accordion-item">
						<h2 class="accordion-header">
							<button
								class="accordion-button collapsed"
								type="button"
								data-bs-toggle="collapse"
								data-bs-target="#collapse-workflow-advanced-options"
								aria-expanded="false"
								aria-controls="collapse-workflow-advanced-options"
							>
								Advanced options
							</button>
						</h2>
						<div
							id="collapse-workflow-advanced-options"
							class="accordion-collapse collapse"
							data-bs-parent="#accordion-run-workflow"
						>
							<div class="accordion-body">
								<div class="mb-3">
									<label for="workerInit" class="form-label">Worker initialization (Optional)</label
									>
									<textarea
										name="workerInit"
										id="workerInit"
										class="form-control font-monospace"
										rows="5"
										disabled={checkingConfiguration}
										bind:value={workerInitControl}
									/>
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
											<label class="form-check-label" for="setSlurmAccount">
												Set SLURM account
											</label>
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
												{#each slurmAccounts as account}
													<option>{account}</option>
												{/each}
											</select>
										</div>
									{/if}
								{/if}
							</div>
						</div>
					</div>
					{#if selectedDataset && imagePage && imagePage.images.length > 0 && firstTaskIndex !== undefined && mode !== 'restart'}
						<div class="accordion-item">
							<h2 class="accordion-header">
								<button
									class="accordion-button collapsed"
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
								class="accordion-collapse collapse"
								data-bs-parent="#accordion-run-workflow"
							>
								<div class="accordion-body">
									{#if checkingConfiguration}
										This job will process {imagePage.total_count}
										{imagePage.total_count === 1 ? 'image' : 'images'}.
									{:else}
										<DatasetImagesTable
											bind:this={datasetImagesTable}
											dataset={selectedDataset}
											bind:imagePage
											{initialFilterValues}
											{attributeFiltersEnabled}
											useDatasetFilters={false}
											vizarrViewerUrl={null}
											runWorkflowModal={true}
										/>
									{/if}
								</div>
							</div>
						</div>
					{/if}
					{#if datasetImagesLoading}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
					{/if}
				</div>
			{/key}
			{#if checkingConfiguration}
				<hr />
				<h6 class="mt-3">Applied filters</h6>
				{#if Object.entries(appliedAttributeFilters).length > 0 || Object.entries(appliedTypeFilters).length > 0}
					<p>
						Currently, the following filters are applied to the image list before it is passed to
						the first task:
					</p>
					<ul class="mb-0">
						{#each Object.entries(appliedAttributeFilters) as [key, value]}
							<li>{key}: <code>{value}</code></li>
						{/each}
					</ul>
					<ul class="mt-0 mb-1">
						{#each Object.entries(appliedTypeFilters) as [key, value]}
							<li>{key}: <BooleanIcon {value} /></li>
						{/each}
					</ul>
				{:else}
					<p class="mb-0">No filters</p>
				{/if}
			{/if}
		</form>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		{#if checkingConfiguration}
			<button class="btn btn-warning" on:click={() => (checkingConfiguration = false)}>
				Cancel
			</button>
			<button
				class="btn btn-primary"
				on:click|preventDefault={handleApplyWorkflow}
				disabled={applyingWorkflow}
			>
				{#if applyingWorkflow}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
				{/if}
				Confirm
			</button>
		{:else}
			<button class="btn btn-primary" on:click={showConfirmRun} disabled={runBtnDisabled}>
				Run
			</button>
		{/if}
	</svelte:fragment>
</Modal>

<style>
	:global(.boolean-icon) {
		vertical-align: top;
	}
</style>
