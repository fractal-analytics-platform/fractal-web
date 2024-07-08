<script>
	import Ajv from 'ajv';
	import { replaceEmptyStrings } from '$lib/common/component_utilities';
	import {
		displayStandardErrorAlert,
		getValidationMessagesMap,
		validateErrorMapKeys
	} from '$lib/common/errors';
	import StandardDismissableAlert from '../../common/StandardDismissableAlert.svelte';
	import TypesEditor from './TypesEditor.svelte';

	/** @type {(task: import('$lib/types-v2').TaskV2[]) => void} */
	export let addNewTasks;

	let taskSuccessMessage = '';

	// Add a single task fields
	let name = '';
	let command_non_parallel = '';
	let command_parallel = '';
	let source = '';
	let version = '';
	let docs_info = '';
	let docs_link = '';
	let args_schema_version = 'pydantic_v1';
	/** @type {import('$lib/types-v2').TaskV2Type} */
	let taskType = 'non_parallel';

	/** @type {TypesEditor} */
	let typesEditor;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/** @typedef {('name'|'command_non_parallel'|'command_parallel'|'version'|'source'|'input_type'|'output_type'|'args_schema_non_parallel'|'args_schema_parallel'|'args_schema_version'|'meta_non_parallel'|'meta_parallel'|'docs_info'|'docs_link')} ErrorKey **/
	/** @type {ErrorKey[]} */
	const handledErrorKeys = [
		'name',
		'command_non_parallel',
		'command_parallel',
		'version',
		'source',
		'input_type',
		'output_type',
		'args_schema_parallel',
		'args_schema_non_parallel',
		'args_schema_version',
		'meta_non_parallel',
		'meta_parallel',
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

		const argsSchemaNonParallel = await getArgsSchemaNonParallel();
		if (argsSchemaNonParallel instanceof Error) {
			addValidationError('args_schema_non_parallel', argsSchemaNonParallel.message);
		}

		const argsSchemaParallel = await getArgsSchemaParallel();
		if (argsSchemaParallel instanceof Error) {
			addValidationError('args_schema_parallel', argsSchemaParallel.message);
		}

		const metaNonParallel = await getMetaNonParallel();
		if (metaNonParallel instanceof Error) {
			addValidationError('meta_non_parallel', metaNonParallel.message);
		}

		const metaParallel = await getMetaParallel();
		if (metaParallel instanceof Error) {
			addValidationError('meta_parallel', metaParallel.message);
		}

		const typesValid = typesEditor.validate();

		if (Object.keys(validationErrors).length > 0 || !typesValid) {
			return;
		}

		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		const bodyData = {
			name,
			command_non_parallel,
			command_parallel,
			version,
			source,
			input_types: typesEditor.getInputTypes(),
			output_types: typesEditor.getOutputTypes(),
			docs_info,
			docs_link
		};

		if (argsSchemaNonParallel && (taskType === 'non_parallel' || taskType === 'compound')) {
			bodyData.args_schema_non_parallel = argsSchemaNonParallel;
		}

		if (argsSchemaParallel && (taskType === 'parallel' || taskType === 'compound')) {
			bodyData.args_schema_parallel = argsSchemaParallel;
		}

		if (
			(argsSchemaNonParallelFiles && argsSchemaNonParallelFiles.length > 0) ||
			(argsSchemaParallelFiles && argsSchemaParallelFiles.length > 0)
		) {
			bodyData.args_schema_version = args_schema_version;
		}

		if (metaNonParallel) {
			bodyData.meta_non_parallel = metaNonParallel;
		}
		if (metaParallel) {
			bodyData.meta_parallel = metaParallel;
		}

		const response = await fetch(`/api/v2/task`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify(bodyData, replaceEmptyStrings)
		});

		const result = await response.json();
		if (response.ok) {
			// Add created task to the list
			console.log('Task created', result);
			addNewTasks([result]);
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
	let argsSchemaNonParallelFiles = null;
	/** @type {HTMLInputElement|undefined} */
	let argsSchemaNonParallelFileInput = undefined;
	/** @type {FileList|null} */
	let argsSchemaParallelFiles = null;
	/** @type {HTMLInputElement|undefined} */
	let argsSchemaParallelFileInput = undefined;

	/** @type {FileList|null} */
	let metaFilesNonParallel = null;
	/** @type {HTMLInputElement|undefined} */
	let metaFileInputNonParallel = undefined;
	/** @type {FileList|null} */
	let metaFilesParallel = null;
	/** @type {HTMLInputElement|undefined} */
	let metaFileInputParallel = undefined;

	/**
	 * @returns {Promise<object|Error|undefined>}
	 */
	async function getArgsSchemaNonParallel() {
		removeValidationError('args_schema_non_parallel');
		if (!argsSchemaNonParallelFiles || argsSchemaNonParallelFiles.length === 0) {
			return;
		}
		return parseArgsSchemaContent(argsSchemaNonParallelFiles);
	}

	/**
	 * @returns {Promise<object|Error|undefined>}
	 */
	async function getArgsSchemaParallel() {
		removeValidationError('args_schema_parallel');
		if (!argsSchemaParallelFiles || argsSchemaParallelFiles.length === 0) {
			return;
		}
		return parseArgsSchemaContent(argsSchemaParallelFiles);
	}

	/**
	 * @param {FileList} argsSchemaFiles
	 */
	async function parseArgsSchemaContent(argsSchemaFiles) {
		let content = '';
		try {
			const argsSchemaFile = argsSchemaFiles[0];
			content = await argsSchemaFile.text();
		} catch (err) {
			return new Error('Unable to read file');
		}
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

	async function getMetaNonParallel() {
		removeValidationError('meta_non_parallel');
		return await getMeta(metaFilesNonParallel);
	}

	async function getMetaParallel() {
		removeValidationError('meta_parallel');
		return await getMeta(metaFilesParallel);
	}

	/**
	 * @param {FileList|null} metaFiles
	 * @returns {Promise<object|Error|undefined>}
	 */
	async function getMeta(metaFiles) {
		if (!metaFiles || metaFiles.length === 0) {
			return;
		}
		let content = '';
		try {
			const metaFile = metaFiles[0];
			content = await metaFile.text();
		} catch (err) {
			return new Error('Unable to read file');
		}
		try {
			return JSON.parse(content);
		} catch (err) {
			return new Error("File doesn't contain valid JSON");
		}
	}

	function clearArgsSchemaNonParallelFileUpload() {
		argsSchemaNonParallelFiles = null;
		if (argsSchemaNonParallelFileInput) {
			argsSchemaNonParallelFileInput.value = '';
		}
		removeValidationError('args_schema_non_parallel');
	}

	function clearArgsSchemaParallelFileUpload() {
		argsSchemaParallelFiles = null;
		if (argsSchemaParallelFileInput) {
			argsSchemaParallelFileInput.value = '';
		}
		removeValidationError('args_schema_parallel');
	}

	function clearMetaNonParallelFileUpload() {
		metaFilesNonParallel = null;
		if (metaFileInputNonParallel) {
			metaFileInputNonParallel.value = '';
		}
		removeValidationError('meta_non_parallel');
	}

	function clearMetaParallelFileUpload() {
		metaFilesParallel = null;
		if (metaFileInputParallel) {
			metaFileInputParallel.value = '';
		}
		removeValidationError('meta_parallel');
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
		command_non_parallel = '';
		command_parallel = '';
		version = '';
		source = '';
		typesEditor.init({}, {});
		docs_info = '';
		docs_link = '';
		args_schema_version = 'pydantic_v1';
		clearArgsSchemaNonParallelFileUpload();
		clearArgsSchemaParallelFileUpload();
		clearMetaNonParallelFileUpload();
		clearMetaParallelFileUpload();
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
	<div class="row mb-1">
		<div class="col-xl-1 col-lg-2 col-3">Task type</div>
		<div class="col-xl-11 col-lg-8 col-9">
			<div class="form-check form-check-inline">
				<input
					class="form-check-input"
					type="radio"
					name="taskType"
					id="non_parallel"
					value="non_parallel"
					bind:group={taskType}
				/>
				<label class="form-check-label" for="non_parallel"> Non parallel </label>
			</div>
			<div class="form-check form-check-inline">
				<input
					class="form-check-input"
					type="radio"
					name="taskType"
					id="parallel"
					value="parallel"
					bind:group={taskType}
				/>
				<label class="form-check-label" for="parallel">Parallel</label>
			</div>
			<div class="form-check form-check-inline">
				<input
					class="form-check-input"
					type="radio"
					name="taskType"
					id="compound"
					value="compound"
					bind:group={taskType}
				/>
				<label class="form-check-label" for="compound">Compound</label>
			</div>
		</div>
	</div>
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
	{#if taskType === 'non_parallel' || taskType === 'compound'}
		<div class="row">
			<div class="col-12 mb-2">
				<div class="input-group has-validation">
					<label for="command_non_parallel" class="input-group-text">Command non parallel</label>
					<input
						name="command_non_parallel"
						id="command_non_parallel"
						type="text"
						class="form-control"
						bind:value={command_non_parallel}
						class:is-invalid={validationErrors['command_non_parallel']}
						required
					/>
					<span class="invalid-feedback">{validationErrors['command_non_parallel']}</span>
				</div>
			</div>
		</div>
	{/if}
	{#if taskType === 'parallel' || taskType === 'compound'}
		<div class="row">
			<div class="col-12 mb-2">
				<div class="input-group has-validation">
					<label for="command_parallel" class="input-group-text">Command parallel</label>
					<input
						name="command_parallel"
						id="command_parallel"
						type="text"
						class="form-control"
						bind:value={command_parallel}
						class:is-invalid={validationErrors['command_parallel']}
						required
					/>
					<span class="invalid-feedback">{validationErrors['command_parallel']}</span>
				</div>
			</div>
		</div>
	{/if}
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
		<div class="col-xl-8">
			<TypesEditor bind:this={typesEditor} />
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
	{#if taskType === 'non_parallel' || taskType === 'compound'}
		<div class="row">
			<div class="col-lg-6 mb-2">
				<div class="input-group has-validation">
					<label for="metaFileNonParallel" class="input-group-text">
						<i class="bi bi-file-earmark-arrow-up" /> &nbsp; Upload non parallel meta file
					</label>
					<input
						class="form-control schemaFile"
						accept="application/json"
						type="file"
						name="metaFileNonParallel"
						id="metaFileNonParallel"
						bind:this={metaFileInputNonParallel}
						bind:files={metaFilesNonParallel}
						class:is-invalid={validationErrors['meta_non_parallel']}
					/>
					{#if metaFilesNonParallel && metaFilesNonParallel.length > 0}
						<button class="btn btn-outline-secondary" on:click={clearMetaNonParallelFileUpload}>
							Clear
						</button>
					{/if}
					<span class="invalid-feedback">{validationErrors['meta_non_parallel']}</span>
				</div>
				<div class="form-text">
					Additional metadata related to execution (e.g. computational resources)
				</div>
			</div>
			<div class="col-lg-6 mb-2">
				<div class="input-group has-validation">
					<label for="argsSchemaNonParallelFile" class="input-group-text">
						<i class="bi bi-file-earmark-arrow-up" /> &nbsp; Upload non parallel args schema
					</label>
					<input
						class="form-control schemaFile"
						accept="application/json"
						type="file"
						name="argsSchemaNonParallelFile"
						id="argsSchemaNonParallelFile"
						bind:this={argsSchemaNonParallelFileInput}
						bind:files={argsSchemaNonParallelFiles}
						class:is-invalid={validationErrors['args_schema_non_parallel']}
					/>
					{#if argsSchemaNonParallelFiles && argsSchemaNonParallelFiles.length > 0}
						<button
							class="btn btn-outline-secondary"
							on:click={clearArgsSchemaNonParallelFileUpload}
						>
							Clear
						</button>
					{/if}
					<span class="invalid-feedback">{validationErrors['args_schema_non_parallel']}</span>
				</div>
				<div class="form-text">JSON schema of task arguments - non parallel</div>
			</div>
		</div>
	{/if}
	{#if taskType === 'parallel' || taskType === 'compound'}
		<div class="row">
			<div class="col-lg-6 mb-2">
				<div class="input-group has-validation">
					<label for="metaFileParallel" class="input-group-text">
						<i class="bi bi-file-earmark-arrow-up" /> &nbsp; Upload parallel meta file
					</label>
					<input
						class="form-control schemaFile"
						accept="application/json"
						type="file"
						name="metaFileParallel"
						id="metaFileParallel"
						bind:this={metaFileInputParallel}
						bind:files={metaFilesParallel}
						class:is-invalid={validationErrors['meta_parallel']}
					/>
					{#if metaFilesParallel && metaFilesParallel.length > 0}
						<button class="btn btn-outline-secondary" on:click={clearMetaParallelFileUpload}>
							Clear
						</button>
					{/if}
					<span class="invalid-feedback">{validationErrors['meta_parallel']}</span>
				</div>
				<div class="form-text">
					Additional metadata related to execution (e.g. computational resources)
				</div>
			</div>
			<div class="col-lg-6 mb-2">
				<div class="input-group has-validation">
					<label for="argsSchemaParallelFile" class="input-group-text">
						<i class="bi bi-file-earmark-arrow-up" /> &nbsp; Upload parallel args schema
					</label>
					<input
						class="form-control schemaFile"
						accept="application/json"
						type="file"
						name="argsSchemaParallelFile"
						id="argsSchemaParallelFile"
						bind:this={argsSchemaParallelFileInput}
						bind:files={argsSchemaParallelFiles}
						class:is-invalid={validationErrors['args_schema_parallel']}
					/>
					{#if argsSchemaParallelFiles && argsSchemaParallelFiles.length > 0}
						<button class="btn btn-outline-secondary" on:click={clearArgsSchemaParallelFileUpload}>
							Clear
						</button>
					{/if}
					<span class="invalid-feedback">{validationErrors['args_schema_parallel']}</span>
				</div>
				<div class="form-text">JSON schema of task arguments - parallel</div>
			</div>
		</div>
	{/if}
	{#if (argsSchemaParallelFiles && argsSchemaParallelFiles.length > 0) || (argsSchemaNonParallelFiles && argsSchemaNonParallelFiles.length > 0)}
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
