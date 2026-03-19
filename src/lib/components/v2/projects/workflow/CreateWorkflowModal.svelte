<script>
	import { AlertError, getAlertErrorFromResponse } from '$lib/common/errors';
	import { page } from '$app/state';
	import Modal from '../../../common/Modal.svelte';
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import { normalizePayload } from 'fractal-components';
	import TemplatesTable from '../../templates/TemplatesTable.svelte';
	import WorkflowImportFlexibility from './WorkflowImportFlexibility.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {(workflow: import('fractal-components/types/api').WorkflowV2) => void} handleWorkflowImported
	 */

	/** @type {Props} */
	let { handleWorkflowImported } = $props();

	// Component properties
	let creating = $state(false);
	/** @type {boolean|undefined} */
	let importSuccess = $state();
	let workflowName = $state('');

	/** @type {FileList|undefined} */
	let files = $state();
	/** @type {HTMLInputElement|undefined} */
	let fileInput = $state(undefined);

	let workflowFileSelected = $derived(files && files.length > 0);
	let projectId = $derived(page.params.projectId);

	/** @type {Modal|undefined} */
	let modal = $state();

	/** @type {'new'|'import'|'template'} */
	let mode = $state('new');

	/** @type {import('fractal-components/types/api').WorkflowImportErrorData[]|undefined} */
	let workflowImportErrorData = $state(undefined);
	/** @type {(string|undefined)[]} */
	let selectedVersions = $state([]);

	/** @type {import('fractal-components/types/api').WorkflowImport|undefined} */
	let workflowMetadata = $state(undefined);

	let includeOlderVersions = $state(false)

	/** @type {number|undefined} */
	let singleSelectedTemplateId = $state();


	$effect(() => {
		includeOlderVersions;
		if (!workflowImportErrorData) {
			selectedVersions = [];
			return;
		}
		selectedVersions = workflowImportErrorData.map(item =>
			item.outcome === "fail"
			? undefined
			: item.version !== null
				? item.version
				: undefined
		);
	});
	
	export function show() {
		modal?.show();
	}

	export function reset() {
		files=undefined;
		if (fileInput) {
			fileInput.value = '';
		}
		workflowName = '';
		creating = false;
		workflowImportErrorData = undefined;
		workflowMetadata = undefined;
		selectedVersions = [];
		includeOlderVersions = false;
		mode='new';
		modal?.hideErrorAlert();
	}

	function handleImportWorkflow() {
		modal?.confirmAndHide(
			async () => {
				creating = true;
				await _handleImportWorkflow();
			},
			() => {
				creating = false;
			}
		);
	}

	function handleCreateWorkflow() {
		modal?.confirmAndHide(
			async () => {
				creating = true;
				await _handleCreateWorkflow();
			},
			() => {
				creating = false;
			}
		);
	}

	async function _handleImportWorkflow() {

		if (!workflowImportErrorData) {
			const workflowFile = /** @type {FileList} */ (files)[0];
			try {
				workflowMetadata = JSON.parse(await workflowFile.text());
			} catch (err) {
				console.error(err);
				throw new AlertError('The workflow file is not a valid JSON file');
			}
		}

		if (workflowMetadata) {
			workflowMetadata.task_list.forEach((item, index) => {
				const version = selectedVersions[index];
				if (version !== undefined) {
					item.task.version = version;
				}
			});

			if (workflowName) {
				console.log(`Overriding workflow name from ${workflowMetadata.name} to ${workflowName}`);
				workflowMetadata.name = workflowName;
			}
		}


		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v2/project/${page.params.projectId}/workflow/import`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: normalizePayload(workflowMetadata)
		});

		if (response.ok) {
			// Return a workflow item
			importSuccess = true;
			setTimeout(() => {
				importSuccess = false;
			}, 3000);
			reset();

			/** @type {import('fractal-components/types/api').WorkflowV2} */
			const workflow = await response.json();

			await tick();

			handleWorkflowImported(workflow);
		} else {
			console.error('Import workflow failed');

			const alertError = await getAlertErrorFromResponse(response);
			const result = alertError.reason;

			if (typeof result === 'object' && 'detail' in result && result.detail.includes("HAS_ERROR_DATA")) {
				workflowImportErrorData = result.data
				throw new Error();
			}

			throw alertError;
		}
	}

	async function _handleCreateWorkflow() {
		if (!workflowName) {
			return;
		}

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v2/project/${projectId}/workflow`, {
			method: 'POST',
			credentials: 'include',
			mode: 'cors',
			headers,
			body: normalizePayload({
				name: workflowName
			})
		});

		if (response.ok) {
			const result = await response.json();
			workflowName = '';
			goto(`/v2/projects/${projectId}/workflows/${result.id}`);
		} else {
			throw await getAlertErrorFromResponse(response);
		}
	}


	async function handleSelect() {
		modal?.hideErrorAlert();

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		

		const payload = {};
		if (workflowName) {
			payload.name = workflowName;
		}
		
		
		if (selectedVersions.length > 0) {
			const response1 = await fetch(
				`/api/v2/workflow-template/${singleSelectedTemplateId}`, 
				{
					method: 'GET',
					credentials: 'include',
					headers,
				}
			);
			/** @type {import('fractal-components/types/api').WorkflowTemplate} */
			const template = await response1.json();
			const originalVersions = template.data.task_list.map(t => t.task.version);
			payload.override_versions = Object.fromEntries(
				selectedVersions
					.map((v, i) => (v !== originalVersions[i] ? [i, v] : null))
					.filter(
						/** @returns {entry is [number, string]} */
						(entry) => entry !== null
					)
			);
		}
		const response2 = await fetch(
			`/api/v2/project/${page.params.projectId}/workflow/import-from-template?template_id=${singleSelectedTemplateId}`, 
			{
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify(payload),
			}
		);
		

		if (response2.ok) {
			// Return a workflow item
			importSuccess = true;
			setTimeout(() => {
				importSuccess = false;
			}, 3000);
			reset();

			/** @type {import('fractal-components/types/api').WorkflowV2} */
			const workflow = await response2.json();

			await tick();

			handleWorkflowImported(workflow);
		} else {
			console.error('Import workflow failed');
			const alertError = await getAlertErrorFromResponse(response2);
			const result = alertError.reason;
			if (typeof result === 'object' && 'detail' in result && result.detail.includes("HAS_ERROR_DATA")) {
				workflowImportErrorData = result.data
				throw new Error();
			}
			modal?.displayErrorAlert(alertError);
		}
	}

</script>

<Modal
	id="createWorkflowModal"
	size="xl"
	centered={true}
	scrollable={true}
	onOpen={reset}
	onClose={reset}
	bind:this={modal}
>
	{#snippet header()}
		<h5 class="modal-title">Create new workflow</h5>
	{/snippet}
	{#snippet body()}
	<!-- SWITCHER -->
	<div class="row mb-3">

		<div class="col-10">
			<div class="form-check form-check-inline mb-3">
				<input
					class="form-check-input"
					type="radio"
					name="createWorkflowMode"
					id="createWorkflowModeNew"
					value="new"
					onclick={reset}
					bind:group={mode}
				/>
				<label class="form-check-label" for="createWorkflowModeNew">Create new</label>
			</div>
			<div class="form-check form-check-inline mb-3">
				<input
					class="form-check-input"
					type="radio"
					name="createWorkflowMode"
					id="createWorkflowModeImport"
					value="import"
					onclick={reset}
					bind:group={mode}
				/>
				<label class="form-check-label" for="createWorkflowModeImport">Import from file</label>
			</div>
			<div class="form-check form-check-inline mb-3">
				<input
					class="form-check-input"
					type="radio"
					name="createWorkflowMode"
					id="createWorkflowModeTemplate"
					value="template"
					onclick={reset}
					bind:group={mode}
				/>
				<label class="form-check-label" for="createWorkflowModeTemplate">Create from template</label>
			</div>
		</div>
	</div>
	{#if mode==='new'}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleCreateWorkflow();
			}}
		>
			<div class="mb-2">
				<label for="workflowName" class="form-label">Workflow name</label>
				<input
					id="workflowName"
					name="workflowName"
					type="text"
					bind:value={workflowName}
					class="form-control"
				/>
			</div>
			<button
				class="btn btn-primary mt-2"
				disabled={(!workflowName) || creating}
			>
				{#if creating}
					<span
						class="spinner-border spinner-border-sm"
						role="status"
						aria-hidden="true">
					</span>
				{/if}			
				Create empty workflow
			</button>
			<div class="mt-2" id="errorAlert-createWorkflowModal"></div>
		</form>

	{:else if mode==='import'}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleImportWorkflow();
			}}
		>
			<div class="mb-2">
				<label for="workflowName" class="form-label">Workflow name</label>
				<input
					id="workflowName"
					name="workflowName"
					type="text"
					bind:value={workflowName}
					class="form-control"
				/>
			</div>
	
			{#if !workflowImportErrorData}
				<div class="mb-3">
					<label for="workflowFile" class="form-label">Select a file</label>
					<input
						class="form-control"
						accept="application/json"
						type="file"
						name="workflowFile"
						id="workflowFile"
						bind:this={fileInput}
						bind:files
					/>
				</div>
				<button
					class="btn btn-primary mt-2"
					disabled={!workflowFileSelected || creating}
				>
					{#if creating}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
					{/if}
					Import workflow
				</button>
			{:else}
				<WorkflowImportFlexibility
					bind:workflowImportErrorData
					bind:selectedVersions
					bind:includeOlderVersions
					bind:workflowMetadata
					{creating}
				/>
			{/if}
			<div class="mt-2" id="errorAlert-createWorkflowModal"></div>
		</form>
		{#if importSuccess}
			<p class="alert alert-primary mt-3">Workflow imported successfully</p>
		{/if}
	{:else}
		<div class="mb-2">
				<label for="workflowName" class="form-label">Workflow name</label>
				<input
					id="workflowName"
					name="workflowName"
					type="text"
					bind:value={workflowName}
					class="form-control"
				/>
			</div>
			<div class="mt-2" id="errorAlert-createWorkflowModal"></div>
			{#if !workflowImportErrorData}
			<div>Select a template</div>
				<TemplatesTable 
					modalType='select'
					{handleSelect}
					bind:singleSelectedTemplateId
				/>
			{:else}
				<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSelect();
				}}
				>
				<WorkflowImportFlexibility
					bind:workflowImportErrorData
					bind:selectedVersions
					bind:includeOlderVersions
					bind:workflowMetadata
					{creating}
				/>
				</form>
			{/if}
	{/if}

	{/snippet}
</Modal>
