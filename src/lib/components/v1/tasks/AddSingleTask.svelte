<script>
	import Ajv from 'ajv';
	import { replaceEmptyStrings } from '$lib/common/component_utilities';
	import {
		displayStandardErrorAlert,
		getValidationMessagesMap,
		validateErrorMapKeys
	} from '$lib/common/errors';
	import StandardDismissableAlert from '../../common/StandardDismissableAlert.svelte';

	/** @type {(task: import('$lib/types').Task) => void} */
	export let addNewTask;

	let taskSuccessMessage = '';

	// Add a single task fields
	let name = '';
	let command = '';
	let source = '';
	let version = '';
	let input_type = '';
	let output_type = '';
	let docs_info = '';
	let docs_link = '';
	let args_schema_version = 'pydantic_v1';

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/** @typedef {('name'|'command'|'version'|'source'|'input_type'|'output_type'|'args_schema'|'args_schema_version'|'meta'|'docs_info'|'docs_link')} ErrorKey **/
	/** @type {ErrorKey[]} */
	const handledErrorKeys = [
		'name',
		'command',
		'version',
		'source',
		'input_type',
		'output_type',
		'args_schema',
		'args_schema_version',
		'meta',
		'docs_info',
		'docs_link'
	];
	/** @type {{[key in ErrorKey]?: string}} */
	let validationErrors = {};

	/**
	 * Creates a new task in the server
	 * @returns {Promise<*>}
	 */
	async function handleCreateTask() {
		taskSuccessMessage = '';
		if (errorAlert) {
			errorAlert.hide();
		}
		validationErrors = {};

		const argsSchema = await getArgsSchema();
		if (argsSchema instanceof Error) {
			addValidationError('args_schema', argsSchema.message);
			return;
		}

		const meta = await getMeta();
		if (meta instanceof Error) {
			addValidationError('meta', meta.message);
			return;
		}

		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		const bodyData = {
			name,
			command,
			version,
			source,
			input_type,
			output_type,
			docs_info,
			docs_link
		};

		if (argsSchema) {
			bodyData.args_schema = argsSchema;
			bodyData.args_schema_version = args_schema_version;
		}

		if (meta) {
			bodyData.meta = meta;
		}

		const response = await fetch(`/api/v1/task`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify(bodyData, replaceEmptyStrings)
		});

		const result = await response.json();
		if (response.ok) {
			// Add created task to the list
			console.log('Task created', result);
			addNewTask(result);
			taskSuccessMessage = 'Task created successfully';
			resetFields();
		} else {
			console.error('Unable to create task', result);
			const errorsMap = getValidationMessagesMap(result, response.status);
			if (errorsMap && validateErrorMapKeys(errorsMap, handledErrorKeys)) {
				validationErrors = errorsMap;
			} else {
				errorAlert = displayStandardErrorAlert(result, 'errorAlert-createTask');
			}
		}
	}

	/** @type {FileList|null} */
	let argsSchemaFiles = null;
	/** @type {HTMLInputElement|undefined} */
	let argsSchemaFileInput = undefined;

	/** @type {FileList|null} */
	let metaFiles = null;
	/** @type {HTMLInputElement|undefined} */
	let metaFileInput = undefined;

	/**
	 * @returns {Promise<object|Error|undefined>}
	 */
	async function getArgsSchema() {
		removeValidationError('args_schema');
		if (!argsSchemaFiles || argsSchemaFiles.length === 0) {
			return;
		}
		const argsSchemaFile = argsSchemaFiles[0];
		let content = await argsSchemaFile.text();
		let json;
		try {
			json = JSON.parse(content);
		} catch (err) {
			return new Error("File doesn't contain valid JSON");
		}
		const ajv = new Ajv();
		try {
			ajv.compile(json);
		} catch (err) {
			return new Error(
				`File doesn't contain valid JSON Schema: ${/** @type {Error} */ (err).message}`
			);
		}
		return json;
	}

	/**
	 * @returns {Promise<object|Error|undefined>}
	 */
	async function getMeta() {
		removeValidationError('meta');
		if (!metaFiles || metaFiles.length === 0) {
			return;
		}
		const metaFile = metaFiles[0];
		let content = await metaFile.text();
		try {
			return JSON.parse(content);
		} catch (err) {
			return new Error("File doesn't contain valid JSON");
		}
	}

	function clearArgsSchemaFileUpload() {
		argsSchemaFiles = null;
		if (argsSchemaFileInput) {
			argsSchemaFileInput.value = '';
		}
		removeValidationError('args_schema');
	}

	function clearMetaFileUpload() {
		metaFiles = null;
		if (metaFileInput) {
			metaFileInput.value = '';
		}
		removeValidationError('meta');
	}

	/**
	 * @param {ErrorKey} key
	 * @param {string} value
	 */
	function addValidationError(key, value) {
		validationErrors = { ...validationErrors, [key]: value };
	}

	/**
	 * @param {ErrorKey} key
	 */
	function removeValidationError(key) {
		const newErrors = { ...validationErrors };
		delete newErrors[key];
		validationErrors = newErrors;
	}

	function resetFields() {
		name = '';
		command = '';
		version = '';
		source = '';
		input_type = '';
		output_type = '';
		docs_info = '';
		docs_link = '';
		args_schema_version = 'pydantic_v1';
		clearArgsSchemaFileUpload();
		clearMetaFileUpload();
		closeDocsAccordion();
	}

	function closeDocsAccordion() {
		const docsAccordionBtn = document.querySelector('#accordionDocs .accordion-button');
		const docsAccordion = document.querySelector('#accordionDocs .accordion-collapse');
		if (docsAccordionBtn && docsAccordion) {
			docsAccordionBtn.setAttribute('aria-expanded', 'false');
			docsAccordionBtn.classList.add('collapsed');
			docsAccordion.classList.remove('show');
		}
	}
</script>

<StandardDismissableAlert message={taskSuccessMessage} />

<form on:submit|preventDefault={handleCreateTask}>
	<div class="row">
		<div class="col-md-6 mb-2">
			<div class="input-group has-validation">
				<label for="name" class="input-group-text">Task name</label>
				<input
					name="name"
					id="name"
					type="text"
					class="form-control"
					bind:value={name}
					class:is-invalid={validationErrors['name']}
					required
				/>
				<span class="invalid-feedback">{validationErrors['name']}</span>
			</div>
		</div>
	</div>
	<div class="row">
		<div class="col-12 mb-2">
			<div class="input-group has-validation">
				<label for="command" class="input-group-text">Command</label>
				<input
					name="command"
					id="command"
					type="text"
					class="form-control"
					bind:value={command}
					class:is-invalid={validationErrors['command']}
					required
				/>
				<span class="invalid-feedback">{validationErrors['command']}</span>
			</div>
		</div>
	</div>
	<div class="row">
		<div class="col-md-6 mb-2">
			<div class="input-group has-validation">
				<label for="source" class="input-group-text">Source</label>
				<input
					name="source"
					id="source"
					type="text"
					class="form-control"
					bind:value={source}
					class:is-invalid={validationErrors['source']}
					required
				/>
				<span class="invalid-feedback">{validationErrors['source']}</span>
			</div>
			<div class="form-text">
				Used to match tasks across installations when a workflow is imported
			</div>
		</div>
	</div>
	<div class="row">
		<div class="col-md-6 mb-2">
			<div class="input-group has-validation">
				<label class="input-group-text" for="input_type">Input type</label>
				<input
					name="input_type"
					id="input_type"
					type="text"
					class="form-control"
					bind:value={input_type}
					class:is-invalid={validationErrors['input_type']}
					required
				/>
				<span class="invalid-feedback">{validationErrors['input_type']}</span>
			</div>
			<div class="form-text">
				Expected type of input dataset; use <code>Any</code> for a generic type
			</div>
		</div>
		<div class="col-md-6 mb-2">
			<div class="input-group has-validation">
				<label for="output_type" class="input-group-text">Output type</label>
				<input
					name="output_type"
					id="output_type"
					type="text"
					class="form-control"
					bind:value={output_type}
					class:is-invalid={validationErrors['output_type']}
					required
				/>
				<span class="invalid-feedback">{validationErrors['output_type']}</span>
			</div>
			<div class="form-text">
				Expected type of output dataset; use <code>Any</code> for a generic type
			</div>
		</div>
	</div>
	<div class="row mb-2 mt-2">
		<div class="col">
			<span class="fw-bold text-secondary">Optional arguments</span>
		</div>
	</div>
	<div class="row">
		<div class="col-md-6 mb-2">
			<div class="input-group has-validation">
				<label for="version" class="input-group-text">Version</label>
				<input
					name="version"
					id="version"
					type="text"
					class="form-control"
					bind:value={version}
					class:is-invalid={validationErrors['version']}
				/>
				<span class="invalid-feedback">{validationErrors['version']}</span>
			</div>
		</div>
	</div>
	<div class="row">
		<div class="col-lg-6 mb-2">
			<div class="input-group has-validation">
				<label for="argsSchemaFile" class="input-group-text">
					<i class="bi bi-file-earmark-arrow-up" /> &nbsp; Upload args schema
				</label>
				<input
					class="form-control schemaFile"
					accept="application/json"
					type="file"
					name="argsSchemaFile"
					id="argsSchemaFile"
					bind:this={argsSchemaFileInput}
					bind:files={argsSchemaFiles}
					class:is-invalid={validationErrors['args_schema']}
				/>
				{#if argsSchemaFiles && argsSchemaFiles.length > 0}
					<button class="btn btn-outline-secondary" on:click={clearArgsSchemaFileUpload}>
						Clear
					</button>
				{/if}
				<span class="invalid-feedback">{validationErrors['args_schema']}</span>
			</div>
			<div class="form-text">JSON schema of task arguments</div>
		</div>
		<div class="col-lg-6 mb-2">
			<div class="input-group has-validation">
				<label for="metaFile" class="input-group-text">
					<i class="bi bi-file-earmark-arrow-up" /> &nbsp; Upload a meta file
				</label>
				<input
					class="form-control schemaFile"
					accept="application/json"
					type="file"
					name="metaFile"
					id="metaFile"
					bind:this={metaFileInput}
					bind:files={metaFiles}
					class:is-invalid={validationErrors['meta']}
				/>
				{#if metaFiles && metaFiles.length > 0}
					<button class="btn btn-outline-secondary" on:click={clearMetaFileUpload}> Clear </button>
				{/if}
				<span class="invalid-feedback">{validationErrors['meta']}</span>
			</div>
			<div class="form-text">
				Additional metadata related to execution (e.g. computational resources)
			</div>
		</div>
	</div>
	{#if argsSchemaFiles && argsSchemaFiles.length > 0}
		<div class="row">
			<div class="col-md-6 mb-2">
				<div class="input-group has-validation">
					<label for="args_schema_version" class="input-group-text">Args schema version</label>
					<input
						name="args_schema_version"
						id="args_schema_version"
						type="text"
						class="form-control"
						bind:value={args_schema_version}
						class:is-invalid={validationErrors['args_schema_version']}
						required
					/>
					<span class="invalid-feedback">{validationErrors['args_schema_version']}</span>
				</div>
				<div class="form-text">
					Label pointing at how the JSON schema of task arguments was generated
				</div>
			</div>
		</div>
	{/if}
	<div class="accordion mb-2" id="accordionDocs">
		<div class="accordion-item">
			<h2 class="accordion-header">
				<button
					class="accordion-button collapsed"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target="#collapseDocs"
					aria-expanded="false"
					aria-controls="collapseDocs"
				>
					Documentation
				</button>
			</h2>
			<div id="collapseDocs" class="accordion-collapse collapse" data-bs-parent="#accordionDocs">
				<div class="accordion-body">
					<div class="row">
						<div class="col-md-12 mb-2">
							<label class="form-label" for="docs_info">Docs info:</label>
							<textarea
								class="form-control"
								id="docs_info"
								bind:value={docs_info}
								class:is-invalid={validationErrors['docs_info']}
								rows="10"
							/>
						</div>
					</div>
					<div class="row">
						<div class="col-md-12">
							<div class="input-group has-validation">
								<label for="docs_link" class="input-group-text">Docs link</label>
								<input
									name="docs_link"
									id="docs_link"
									type="text"
									class="form-control"
									bind:value={docs_link}
									class:is-invalid={validationErrors['docs_link']}
								/>
								<span class="invalid-feedback">{validationErrors['docs_link']}</span>
							</div>
							<div class="form-text">Link to task docs</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="row">
		<div id="errorAlert-createTask" />
		<div class="col-auto">
			<button type="submit" class="btn btn-primary mt-2 mb-3">Create</button>
		</div>
	</div>
</form>

<style>
	.schemaFile::-webkit-file-upload-button {
		display: none;
	}

	.schemaFile::file-selector-button {
		display: none;
	}
</style>
