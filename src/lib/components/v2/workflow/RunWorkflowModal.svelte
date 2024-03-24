<script>
	import { replaceEmptyStrings } from '$lib/common/component_utilities';
	import { AlertError } from '$lib/common/errors';
	import {
		generateNewUniqueDatasetName,
		getFirstTaskIndexForContinuingWorkflow
	} from '$lib/common/job_utilities';
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import { onMount } from 'svelte';

	/** @type {import('$lib/types-v2').DatasetV2[]} */
	export let datasets;
	/** @type {import('$lib/types-v2').WorkflowV2} */
	export let workflow;
	/** @type {number|undefined} */
	export let selectedDatasetId;
	/** @type {(job: import('$lib/types-v2').ApplyWorkflowV2) => Promise<void>} */
	export let onJobSubmitted;
	/** @type {(updatedDatasets: import('$lib/types-v2').DatasetV2[], newSelectedDatasetId: number) => void} */
	export let onDatasetsUpdated;
	/** @type {{[key: number]: import('$lib/types').JobStatus}} */
	export let statuses;

	/** @type {Modal} */
	let modal;

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

	/**
	 * @param {'run'|'restart'|'continue'} action
	 */
	export function open(action) {
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
			last_task_index: lastTaskIndex
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
		const { id, name, zarr_dir } = /** @type {import('$lib/types-v2').DatasetV2} */ (
			selectedDataset
		);
		await handleDatasetDelete(id);
		const newDatasets = datasets.filter((d) => d.id !== id);
		const newDataset = await handleDatasetCreate(name, zarr_dir);
		newDatasets.push(newDataset);
		onDatasetsUpdated(newDatasets, newDataset.id);
	}

	async function createNewDataset() {
		const { zarr_dir } = /** @type {import('$lib/types-v2').DatasetV2} */ (selectedDataset);
		const newDataset = await handleDatasetCreate(newDatasetName, zarr_dir);
		onDatasetsUpdated([...datasets, newDataset], newDataset.id);
	}

	/**
	 * @param {string} datasetName
	 * @param {string} zarrDir
	 * @returns {Promise<import('$lib/types-v2').DatasetV2>}
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
		const result = await response.json();
		if (!response.ok) {
			console.log('Dataset creation failed', result);
			throw new AlertError(result);
		}
		return result;
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
			const result = await response.json();
			console.error('Error while deleting dataset:', result);
			throw new AlertError(result);
		}
	}

	function resetLastTask() {
		if (
			lastTaskIndex !== undefined &&
			firstTaskIndex !== undefined &&
			firstTaskIndex > lastTaskIndex
		) {
			lastTaskIndex = undefined;
		}
	}

	/** @type {{ [key: string]: string|number|boolean }} */
	let appliedAttributeFilters = {};
	/** @type {{ [key: string]: boolean }} */
	let appliedTypeFilters = {};

	function showConfirmRun() {
		checkingConfiguration = true;
		const wft = workflow.task_list[firstTaskIndex || 0];
		if (mode === 'restart') {
			appliedAttributeFilters = { ...wft.input_filters.attributes };
			appliedTypeFilters = { ...wft.input_filters.types };
		} else {
			const dataset = /** @type {import('$lib/types-v2').DatasetV2} */ (selectedDataset);
			appliedAttributeFilters = { ...dataset.filters.attributes, ...wft.input_filters.attributes };
			appliedTypeFilters = { ...dataset.filters.types, ...wft.input_filters.types };
		}
	}

	function computeNewDatasetName() {
		const dataset = /** @type {import('$lib/types-v2').DatasetV2} */ (selectedDataset);
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

	onMount(async () => {
		await loadSlurmAccounts();
	});
</script>

<Modal id="runWorkflowModal" centered={true} bind:this={modal}>
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
					class="form-control"
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
					class="form-control"
					disabled={checkingConfiguration}
					bind:value={firstTaskIndex}
					on:change={resetLastTask}
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
					class="form-control"
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
			<div class="accordion" id="accordion-workflow-advanced-options">
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
							Advanced Options
						</button>
					</h2>
					<div
						id="collapse-workflow-advanced-options"
						class="accordion-collapse collapse"
						data-bs-parent="#accordion-workflow-advanced-options"
					>
						<div class="accordion-body">
							<div class="mb-3">
								<label for="workerInit" class="form-label">Worker initialization (Optional)</label>
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
											class="form-control"
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
