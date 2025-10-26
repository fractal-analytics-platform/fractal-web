<script>
	import { downloadBlob } from '$lib/common/component_utilities';
	import Modal from '$lib/components/common/Modal.svelte';
	import {
		getPropertiesToIgnore,
		JsonSchemaDataError,
		SchemaValidator,
		stripNullAndEmptyObjectsAndArrays
	} from 'fractal-components';
	import { adaptJsonSchema } from 'fractal-components/jschema/jschema_adapter';
	import JsonSchemaValidationErrors from './JsonSchemaValidationErrors.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').WorkflowTaskV2} workflowTask
	 * @property {(json: object) => Promise<void>} onImport
	 * @property {boolean} exportDisabled
	 */

	/** @type {Props} */
	let { workflowTask, onImport, exportDisabled } = $props();

	/** @type {Modal|undefined} */
	let importArgsModal = $state();

	/** @type {FileList|null} */
	let importArgsFiles = $state(null);
	/** @type {HTMLInputElement|undefined} */
	let importArgsFileInput = $state(undefined);
	let importArgsError = $state('');
	/** @type {import('ajv').ErrorObject[] | undefined} */
	let validationErrors = $state();

	function onImportArgsModalOpen() {
		importArgsFiles = null;
		if (importArgsFileInput) {
			importArgsFileInput.value = '';
		}
		importArgsError = '';
		validationErrors = undefined;
	}

	async function importArgs() {
		importArgsError = '';
		validationErrors = undefined;
		if (importArgsFiles === null || importArgsFiles.length === 0) {
			return;
		}
		const file = importArgsFiles[0];
		let content = await file.text();
		let json;
		try {
			json = JSON.parse(content);
		} catch {
			importArgsError = "File doesn't contain valid JSON";
			return;
		}
		try {
			if (json.args_parallel) {
				validateArgumentsForImport(
					workflowTask.task.args_schema_parallel,
					workflowTask.task.args_schema_version,
					json.args_parallel
				);
			}
			if (json.args_non_parallel) {
				validateArgumentsForImport(
					workflowTask.task.args_schema_non_parallel,
					workflowTask.task.args_schema_version,
					json.args_non_parallel
				);
			}
		} catch (err) {
			if (err instanceof Error) {
				importArgsError = err.message;
			}
			return;
		}
		importArgsModal?.confirmAndHide(async function () {
			await onImport(json);
		});
	}

	/**
	 * @param {object} schema
	 * @param {'pydantic_v1'|'pydantic_v2'} schemaVersion
	 * @param {object} data
	 */
	function validateArgumentsForImport(schema, schemaVersion, data) {
		if (!schema) {
			return;
		}
		const adapted = adaptJsonSchema(schema, getPropertiesToIgnore(false));
		const validator = new SchemaValidator(schemaVersion);
		const isSchemaValid = validator.loadSchema(adapted.schema);
		if (!isSchemaValid) {
			throw new Error('Invalid JSON Schema');
		}
		if (!validator.isValid(stripNullAndEmptyObjectsAndArrays(data))) {
			validationErrors = validator.getErrors() || undefined;
			throw new JsonSchemaDataError(validator.getErrors());
		}
	}

	function exportArgs() {
		const args = {
			args_parallel: workflowTask.args_parallel,
			args_non_parallel: workflowTask.args_non_parallel
		};
		const serializedArgs = JSON.stringify(args, null, 2);
		downloadBlob(
			serializedArgs,
			`args-${createSlug(workflowTask.task.name)}.json`,
			'text/json;charset=utf-8;'
		);
	}

	/**
	 * @param {string} value
	 */
	function createSlug(value) {
		return value.trim().toLowerCase().replace(/\s+/g, '-');
	}
</script>

<div class="me-auto">
	<button class="btn btn-outline-primary" onclick={() => importArgsModal?.show()}>
		<i class="bi bi-upload"></i>
		Import
	</button>
	<button class="btn btn-outline-primary" onclick={exportArgs} disabled={exportDisabled}>
		<i class="bi bi-download"></i>
		Export
	</button>
</div>

<Modal
	id="importArgumentsModal"
	onOpen={onImportArgsModalOpen}
	bind:this={importArgsModal}
	size="lg"
>
	{#snippet header()}
		<h1 class="h5 modal-title">Import arguments</h1>
	{/snippet}
	{#snippet body()}
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
					<i class="bi bi-exclamation-triangle"></i>
					The current arguments will be completely overwritten, disregarding any pending changes.
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col">
				<div id="errorAlert-importArgumentsModal"></div>
			</div>
		</div>
		<div class="row mt-0">
			<div class="col">
				<JsonSchemaValidationErrors title="Invalid arguments:" {validationErrors} />
			</div>
		</div>
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button
			class="btn btn-primary"
			disabled={importArgsFiles === null || importArgsFiles.length === 0}
			onclick={importArgs}
		>
			Confirm
		</button>
	{/snippet}
</Modal>
