<script>
	import Ajv from 'ajv';
	import { replaceEmptyStrings } from '$lib/common/component_utilities';
	import {
		displayStandardErrorAlert,
		getValidationMessagesMap,
		validateErrorMapKeys
	} from '$lib/common/errors';
	import StandardDismissableAlert from '../common/StandardDismissableAlert.svelte';

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

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/** @typedef {('name'|'command'|'version'|'source'|'input_type'|'output_type'|'args_schema')} ErrorKey **/
	/** @type {ErrorKey[]} */
	const handledErrorKeys = [
		'name',
		'command',
		'version',
		'source',
		'input_type',
		'output_type',
		'args_schema'
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

		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		const bodyData = {
			name,
			command,
			version,
			source,
			input_type,
			output_type
		};

		if (argsSchema) {
			bodyData.args_schema = argsSchema;
		}

		const response = await fetch('/api/v1/task', {
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
	let files = null;
	/** @type {HTMLInputElement|undefined} */
	let fileInput = undefined;

	/**
	 * @returns {Promise<object|Error|undefined>}
	 */
	async function getArgsSchema() {
		removeValidationError('args_schema');
		if (!files || files.length === 0) {
			return;
		}
		const argsSchemaFile = files[0];
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

	function clearFileUpload() {
		files = null;
		if (fileInput) {
			fileInput.value = '';
		}
		removeValidationError('args_schema');
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
		clearFileUpload();
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
			<div class="form-text">Expected type of input dataset</div>
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
			<div class="form-text">Expected type of output dataset</div>
		</div>
	</div>
	<div class="row">
		<div class="col-lg-6 mb-3">
			<div class="input-group has-validation">
				<label for="argsSchemaFile" class="input-group-text">
					<i class="bi bi-file-earmark-arrow-up" /> &nbsp; Upload args schema
				</label>
				<input
					class="form-control"
					accept="application/json"
					type="file"
					name="argsSchemaFile"
					id="argsSchemaFile"
					bind:this={fileInput}
					bind:files
					class:is-invalid={validationErrors['args_schema']}
				/>
				{#if files && files.length > 0}
					<button class="btn btn-outline-secondary" on:click={clearFileUpload}> Clear </button>
				{/if}
				<span class="invalid-feedback">{validationErrors['args_schema']}</span>
			</div>
			<div class="form-text">JSON schema of task arguments</div>
		</div>
	</div>
	<div class="row">
		<div id="errorAlert-createTask" />
		<div class="col-auto">
			<button type="submit" class="btn btn-primary mb-3">Create</button>
		</div>
	</div>
</form>

<style>
	#argsSchemaFile::-webkit-file-upload-button {
		display: none;
	}

	#argsSchemaFile::file-selector-button {
		display: none;
	}
</style>
