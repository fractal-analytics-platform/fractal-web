<script>
	import { AlertError, getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '../../common/Modal.svelte';
	import { normalizePayload } from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {() => void} onTemplateImport
	 */

	/** @type {Props} */
	let { onTemplateImport } = $props();

	// Component properties
	let creating = $state(false);
	/** @type {string|undefined} */
	let templateName = $state(undefined);
	/** @type {number|undefined} */
	let templateVersion = $state(undefined);

	/** @type {FileList|undefined} */
	let files = $state(undefined);
	/** @type {HTMLInputElement|undefined} */
	let fileInput = $state(undefined);

	/** @type {Modal|undefined} */
	let modal = $state(undefined);

	export function show() {
		modal?.show();
	}

	/**
	 * Reset the form fields.
	 */
	export function close() {
		files = undefined;
		templateName = undefined;
		templateVersion = undefined;
		creating = false;
		if (fileInput) {
			fileInput.value = '';
		}
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

	async function handleImportTemplate() {

		const templateFile = /** @type {FileList} */ (files)[0];
		/** @type {import('fractal-components/types/api').WorkflowTemplateImport} */
		let template;
		
		try {
			template = JSON.parse(await templateFile.text());
		} catch (err) {
			console.error(err);
			throw new AlertError('The workflow file is not a valid JSON file');
		}

		if (templateName) {
			console.log(`Overriding template name from '${template.name}' to '${templateName}'`);
			template.name = templateName;
		}
		if (templateVersion) {
			console.log(`Overriding template version from '${template.version}' to '${templateVersion}'`);
			template.version = templateVersion;
		}

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v2/workflow_template/import`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: normalizePayload(template)
		});

		if (!response.ok) {
			console.error('Import template failed');
			const alertError = await getAlertErrorFromResponse(response);
			throw alertError;
		}
		else {
			await onTemplateImport();
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
		<h5 class="modal-title">Import workflow template from file</h5>
	{/snippet}
	{#snippet body()}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				importTemplate();
			}}
		>		
			<div class="mb-3">
				<input
					class="form-control"
					accept="application/json"
					type="file"
					name="templateFil"
					id="templateFile"
					bind:this={fileInput}
					bind:files
				/>
			</div>
			<div class="mb-2">
				<label for="templateName" class="form-label">Override template name</label>
				<input
					id="templateName"
					name="templateName"
					type="text"
					bind:value={templateName}
					class="form-control"
				/>
			</div>
			<div class="mb-2">
				<label for="templateVersion" class="form-label">Override template version</label>
				<input
					id="templateVersion"
					name="templateVersion"
					type="number"
					bind:value={templateVersion}
					class="form-control"
				/>
			</div>
			<button
				class="btn btn-primary mt-2"
				disabled={!files || creating}
			>
				{#if creating}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
				{/if}
				Import template
			</button>
			<div class="mt-2" id="errorAlert-importTemplateModal"></div>
		</form>
	{/snippet}
</Modal>
