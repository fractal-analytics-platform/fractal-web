<script>
	import { AlertError, getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '../../common/Modal.svelte';
	import { normalizePayload } from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {(arg0: number) => void} onTemplateImport
	 * @property {Array<[number, string]>} groups
	 */

	/** @type {Props} */
	let { onTemplateImport, groups } = $props();

	// Component properties
	let creating = $state(false);

	/** @type {FileList|undefined} */
	let files = $state(undefined);
	/** @type {HTMLInputElement|undefined} */
	let fileInput = $state(undefined);

	/**
	 * @typedef {import('fractal-components/types/api').WorkflowImport} WorkflowImport
	 * @typedef {import('fractal-components/types/api').WorkflowTemplateImport} WorkflowTemplateImport
	 */

	/**
	 * @typedef {Object} WorkflowTemplateImportTemporary
	 * @property {string|null} name
	 * @property {number|null} version
	 * @property {string|null} description
	 * @property {WorkflowImport} data
	 */

	/** @type {WorkflowTemplateImportTemporary|undefined} */
	let template = $state(undefined);
	/** @type {string|undefined} */
	let errorMessage = $state(undefined);

	/** @type {number|undefined} */
	let userGroupId = $state(undefined);
	/** @type {Modal|undefined} */
	let modal = $state(undefined);

	export function show() {
		modal?.show();
	}

	export function reset() {
		files = undefined;
		errorMessage = undefined;
		template = undefined;
		creating = false;
		userGroupId = undefined;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	export function close() {
		reset();
		modal?.hideErrorAlert();
	}

	function importTemplate() {
		modal?.confirmAndHide(
			async () => {
				creating = true;
				await handleImportTemplate();
			},
			() => {
				creating = false;
			}
		);
	}

	/**
	 * @param {any} obj
	 * @returns {obj is WorkflowImport}
	 */
	function isWorkflowImport(obj) {
		return (
			obj &&
			typeof obj === 'object' &&
			typeof obj.name === 'string' &&
			(obj.description === null || typeof obj.description === 'string') &&
			Array.isArray(obj.task_list)
		);
	}

	/**
	 * @param {any} obj
	 * @returns {obj is WorkflowTemplateImport}
	 */
	function isWorkflowTemplateImport(obj) {
		return (
			obj &&
			typeof obj === 'object' &&
			typeof obj.name === 'string' &&
			typeof obj.version === 'number' &&
			(obj.description === null || typeof obj.description === 'string') &&
			isWorkflowImport(obj.data)
		);
	}

	async function handleFileLoading() {
		const templateFile = /** @type {FileList} */ (files)[0];
		const input = JSON.parse(await templateFile.text());

		if (!isWorkflowImport(input) && !isWorkflowTemplateImport(input)) {
			errorMessage = 'the input file is not a Workflow nor a WorkflowTemplate.';
			return;
		}

		try {
			if (isWorkflowTemplateImport(input)) {
				template = input;
			} else {
				template = {
					name: null,
					version: null,
					description: null,
					data: input
				};
			}
		} catch (err) {
			console.error(err);
			throw new AlertError('The imported file must be a Workflow or a WorkflowTemplate');
		}
	}

	async function handleImportTemplate() {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const url = new URL('/api/v2/workflow-template/import', window.location.origin);

		if (userGroupId) {
			url.searchParams.set('user_group_id', String(userGroupId));
		}

		const response = await fetch(url, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: normalizePayload(template)
		});

		if (!response.ok) {
			console.error('Import template failed');
			const alertError = await getAlertErrorFromResponse(response);
			throw alertError;
		} else {
			const result = await response.json();
			await onTemplateImport(result.id);
		}
	}
</script>

<Modal
	id="importTemplateModal"
	size="lg"
	centered={true}
	scrollable={true}
	onOpen={close}
	onClose={close}
	bind:this={modal}
>
	{#snippet header()}
		<h5 class="modal-title">Import workflow template from JSON file</h5>
	{/snippet}
	{#snippet body()}
		{#if !template}
			<div class="mb-3">
				<label class="form-check-label" for="templateFile">Select a file</label>
				<input
					class="form-control"
					accept="application/json"
					type="file"
					name="templateFile"
					id="templateFile"
					bind:this={fileInput}
					bind:files
					onchange={handleFileLoading}
				/>
			</div>
			{#if errorMessage}
				<div class="alert alert-danger mt-3" role="alert">
					<strong>Error:</strong>
					{errorMessage}
				</div>
			{/if}
		{:else}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					importTemplate();
				}}
			>
				<div class="mb-2">
					<label for="templateName" class="form-label">Template name</label>
					<input
						id="templateName"
						name="templateName"
						type="text"
						bind:value={template.name}
						class="form-control"
					/>
				</div>
				<div class="mb-2">
					<label for="templateVersion" class="form-label">Template version</label>
					<input
						id="templateVersion"
						name="templateVersion"
						type="number"
						bind:value={template.version}
						class="form-control"
					/>
				</div>
				<div class="mb-2">
					<label for="templateDescription" class="form-label">Template description</label>
					<input
						id="templateDescription"
						name="templateDescription"
						type="text"
						bind:value={template.description}
						class="form-control"
					/>
				</div>
				<div class="mb-2">
					<label class="form-label" for="template-user-group-id">User Group</label>
					<select class="form-select" id="template-user-group-id" bind:value={userGroupId}>
						<option value={undefined}>Select...</option>
						{#each groups as group, index (index)}
							<option value={group[0]}>{group[1]}</option>
						{/each}
					</select>
				</div>

				<button
					class="btn btn-primary mt-2"
					disabled={creating || !template.name || !template.version}
					aria-label="Import template"
				>
					{#if creating}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
					{/if}
					Import template
				</button>

				<button class="btn btn-danger mt-2" aria-label="Cancel" onclick={reset}> Cancel </button>

				<div class="mt-2" id="errorAlert-importTemplateModal"></div>
			</form>
		{/if}
	{/snippet}
</Modal>
