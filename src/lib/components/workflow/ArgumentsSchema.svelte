<script>
	import { page } from '$app/stores';
	import { createEventDispatcher } from 'svelte';
	import JSchema from '$lib/components/common/jschema/JSchema.svelte';
	import { updateFormEntry } from '$lib/components/workflow/task_form_utils';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import Modal from '../common/Modal.svelte';
	import { downloadBlob } from '$lib/common/component_utilities';

	const SUPPORTED_SCHEMA_VERSIONS = ['pydantic_v1'];

	const dispatch = createEventDispatcher();

	export let workflowId = undefined;
	export let workflowTaskId = undefined;
	export let argumentsSchema = undefined;
	export let argumentsSchemaVersion = undefined;
	export let validSchema = undefined;
	export let args = undefined;

	/** @type {JSchema} */
	let schemaComponent;
	export let unsavedChanges = false;
	let resetChanges = undefined;
	export let saveChanges = undefined;
	let savingChanges = false;

	async function handleSaveChanges(newArgs) {
		const projectId = $page.params.projectId;
		try {
			savingChanges = true;
			const response = await updateFormEntry(
				projectId,
				workflowId,
				workflowTaskId,
				newArgs,
				'args'
			);
			args = response.args;
			dispatch('argsSaved', { args: JSON.parse(JSON.stringify(response.args)) });
			return args;
		} catch (err) {
			displayStandardErrorAlert(err, 'json-schema-validation-errors');
			throw err;
		} finally {
			savingChanges = false;
		}
	}

	function handleValidationErrors(errors) {
		displayStandardErrorAlert(errors, 'json-schema-validation-errors');
	}

	$: {
		if (argumentsSchemaVersion && SUPPORTED_SCHEMA_VERSIONS.includes(argumentsSchemaVersion)) {
			validSchema = true;
		} else {
			validSchema = false;
		}
	}

	function exportArgs() {
		const serializedArgs = JSON.stringify(args, null, 2);
		downloadBlob(serializedArgs, 'args.json', 'text/json;charset=utf-8;');
	}

	/** @type {Modal} */
	let importArgsModal;

	/** @type {FileList|null} */
	let importArgsFiles = null;
	/** @type {HTMLInputElement|undefined} */
	let importArgsFileInput = undefined;
	let importArgsError = '';

	function onImportArgsModalOpen() {
		importArgsFiles = null;
		if (importArgsFileInput) {
			importArgsFileInput.value = '';
		}
		importArgsError = '';
	}

	async function importArgs() {
		importArgsError = '';
		if (importArgsFiles === null || importArgsFiles.length === 0) {
			return;
		}
		const file = importArgsFiles[0];
		let content = await file.text();
		let json;
		try {
			json = JSON.parse(content);
		} catch (err) {
			importArgsError = "File doesn't contain valid JSON";
			return;
		}
		importArgsModal.confirmAndHide(async function () {
			await schemaComponent.saveChanges(json);
		});
	}
</script>

<div id="workflow-arguments-schema-panel">
	<div id="json-schema-validation-errors" />
	<div class="args-list">
		<JSchema
			bind:unsavedChanges
			bind:discardChanges={resetChanges}
			bind:saveChanges
			schema={argumentsSchema}
			schemaData={args}
			{handleSaveChanges}
			{handleValidationErrors}
			bind:this={schemaComponent}
		/>
	</div>
	<div class="d-flex jschema-controls-bar p-3">
		<div />
		<div class="me-auto">
			<button class="btn btn-outline-primary" on:click={() => importArgsModal.show()}>
				<i class="bi bi-upload" />
				Import
			</button>
			<button
				class="btn btn-outline-primary"
				on:click={exportArgs}
				disabled={unsavedChanges || savingChanges}
			>
				<i class="bi bi-download" />
				Export
			</button>
		</div>
		<div>
			<button
				class="btn btn-warning"
				disabled={!unsavedChanges || savingChanges}
				on:click={() => resetChanges(args)}
			>
				Discard changes
			</button>
		</div>
		<div class="ms-1">
			<button
				class="btn btn-success"
				disabled={!unsavedChanges || savingChanges}
				on:click={saveChanges}
			>
				{#if savingChanges}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
				{/if}
				Save changes
			</button>
		</div>
	</div>
</div>

<Modal
	id="importArgumentsModal"
	onOpen={onImportArgsModalOpen}
	bind:this={importArgsModal}
	size="lg"
>
	<svelte:fragment slot="header">
		<h1 class="h5 modal-title">Import arguments</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div class="row">
			<div class="col needs-validation">
				<label for="importArgsFile"> Select arguments file </label>
				<input
					class="form-control mt-1"
					accept="application/json"
					type="file"
					name="importArgsFile"
					id="importArgsFile"
					bind:this={importArgsFileInput}
					bind:files={importArgsFiles}
					class:is-invalid={importArgsError}
				/>
				<span class="invalid-feedback">{importArgsError}</span>
			</div>
			<div class="form-text">JSON containing workflow task arguments</div>
		</div>
		<div class="row">
			<div class="col">
				<div class="alert alert-warning mt-3">
					<i class="bi bi-exclamation-triangle" />
					The current arguments will be completely overwritten, disregarding any pending changes.
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col">
				<div id="errorAlert-importArgumentsModal" />
			</div>
		</div>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button
			class="btn btn-primary"
			disabled={importArgsFiles === null || importArgsFiles.length === 0}
			on:click={importArgs}
		>
			Confirm
		</button>
	</svelte:fragment>
</Modal>

<style>
	#workflow-arguments-schema-panel .args-list {
		overflow-y: auto;
		max-height: 60vh;
		position: relative;
	}

	.jschema-controls-bar {
		background-color: whitesmoke;
		margin-top: 5px;
		border-top: 1px solid lightgray;
	}
</style>
