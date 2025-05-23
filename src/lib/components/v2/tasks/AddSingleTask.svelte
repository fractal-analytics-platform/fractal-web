<script>
	import { replaceEmptyStrings } from '$lib/common/component_utilities';
	import { FormErrorHandler } from '$lib/common/errors';
	import StandardDismissableAlert from '../../common/StandardDismissableAlert.svelte';
	import TaskGroupSelector from './TaskGroupSelector.svelte';
	import TypesEditor from './TypesEditor.svelte';
	import {
		detectSchemaVersion,
		isCompoundType,
		isNonParallelType,
		isParallelType,
		SchemaValidator
	} from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {(task: import('fractal-components/types/api').TaskV2[]) => void} addNewTasks
	 * @property {import('fractal-components/types/api').User} user
	 */

	/** @type {Props} */
	let { addNewTasks, user } = $props();

	let taskSuccessMessage = $state('');

	// Add a single task fields
	let name = $state('');
	let command_non_parallel = $state('');
	let command_parallel = $state('');
	let version = $state('');
	let docs_info = $state('');
	let docs_link = $state('');
	/** @type {'pydantic_v1'|'pydantic_v2'} */
	let args_schema_version = $state('pydantic_v2');
	/** @type {import('fractal-components/types/api').TaskV2Type} */
	let taskType = $state('non_parallel');
	let privateTask = $state(false);
	let selectedGroup = $state(null);

	/** @type {TypesEditor|undefined} */
	let typesEditor = $state();

	const formErrorHandler = new FormErrorHandler('errorAlert-createTask', [
		'name',
		'type',
		'command_non_parallel',
		'command_parallel',
		'version',
		'input_type',
		'output_type',
		'args_schema_parallel',
		'args_schema_non_parallel',
		'args_schema_version',
		'meta_non_parallel',
		'meta_parallel',
		'docs_info',
		'docs_link'
	]);

	const validationErrors = formErrorHandler.getValidationErrorStore();

	/**
	 * Creates a new task in the server
	 * @returns {Promise<*>}
	 */
	async function handleCreateTask() {
		taskSuccessMessage = '';
		formErrorHandler.clearErrors();

		const argsSchemaNonParallel = await getArgsSchemaNonParallel(false);
		if (argsSchemaNonParallel instanceof Error) {
			formErrorHandler.addValidationError(
				'args_schema_non_parallel',
				argsSchemaNonParallel.message
			);
		}

		const argsSchemaParallel = await getArgsSchemaParallel(false);
		if (argsSchemaParallel instanceof Error) {
			formErrorHandler.addValidationError('args_schema_parallel', argsSchemaParallel.message);
		}

		const metaNonParallel = await getMetaNonParallel();
		if (metaNonParallel instanceof Error) {
			formErrorHandler.addValidationError('meta_non_parallel', metaNonParallel.message);
		}

		const metaParallel = await getMetaParallel();
		if (metaParallel instanceof Error) {
			formErrorHandler.addValidationError('meta_parallel', metaParallel.message);
		}

		const typesValid = typesEditor?.validate();

		if (Object.keys($validationErrors).length > 0 || !typesValid) {
			return;
		}

		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		const bodyData = {
			name,
			type: taskType,
			command_non_parallel,
			command_parallel,
			version,
			input_types: typesEditor?.getInputTypes(),
			output_types: typesEditor?.getOutputTypes(),
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

		let url = `/api/v2/task?private=${privateTask}`;
		if (!privateTask) {
			url += `&user_group_id=${selectedGroup}`;
		}

		const response = await fetch(url, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify(bodyData, replaceEmptyStrings)
		});

		if (response.ok) {
			const result = await response.json();
			// Add created task to the list
			console.log('Task created', result);
			addNewTasks([result]);
			taskSuccessMessage = 'Task created successfully';
			resetFields();
		} else {
			console.error('Unable to create task');
			await formErrorHandler.handleErrorResponse(response);
		}
	}

	/** @type {FileList|null} */
	let argsSchemaNonParallelFiles = $state(null);
	/** @type {HTMLInputElement|undefined} */
	let argsSchemaNonParallelFileInput = $state(undefined);
	/** @type {FileList|null} */
	let argsSchemaParallelFiles = $state(null);
	/** @type {HTMLInputElement|undefined} */
	let argsSchemaParallelFileInput = $state(undefined);

	/** @type {FileList|null} */
	let metaFilesNonParallel = $state(null);
	/** @type {HTMLInputElement|undefined} */
	let metaFileInputNonParallel = $state(undefined);
	/** @type {FileList|null} */
	let metaFilesParallel = $state(null);
	/** @type {HTMLInputElement|undefined} */
	let metaFileInputParallel = $state(undefined);

	/**
	 * @param {boolean} autodetectVersion
	 * @returns {Promise<object|Error|undefined>}
	 */
	async function getArgsSchemaNonParallel(autodetectVersion) {
		formErrorHandler.removeValidationError('args_schema_non_parallel');
		if (!argsSchemaNonParallelFiles || argsSchemaNonParallelFiles.length === 0) {
			return;
		}
		return parseArgsSchemaContent(argsSchemaNonParallelFiles, autodetectVersion);
	}

	/**
	 * @param {boolean} autodetectVersion
	 * @returns {Promise<object|Error|undefined>}
	 */
	async function getArgsSchemaParallel(autodetectVersion) {
		formErrorHandler.removeValidationError('args_schema_parallel');
		if (!argsSchemaParallelFiles || argsSchemaParallelFiles.length === 0) {
			return;
		}
		return parseArgsSchemaContent(argsSchemaParallelFiles, autodetectVersion);
	}

	/**
	 * @param {FileList} argsSchemaFiles
	 * @param {boolean} autodetectVersion
	 */
	async function parseArgsSchemaContent(argsSchemaFiles, autodetectVersion) {
		let content = '';
		try {
			const argsSchemaFile = argsSchemaFiles[0];
			content = await argsSchemaFile.text();
		} catch {
			return new Error('Unable to read file');
		}
		let json;
		try {
			json = JSON.parse(content);
		} catch {
			return new Error("File doesn't contain valid JSON");
		}

		if (autodetectVersion) {
			try {
				args_schema_version = detectSchemaVersion(json);
				return json;
			} catch (err) {
				return new Error(
					`File doesn't contain valid JSON Schema: ${/** @type {Error} */ (err).message}`
				);
			}
		} else {
			try {
				const schemaValidator = new SchemaValidator(args_schema_version);
				schemaValidator.validateSchema(json);
				return json;
			} catch (err) {
				return new Error(
					`File doesn't contain valid JSON Schema: ${/** @type {Error} */ (err).message}`
				);
			}
		}
	}

	async function handleNonParallelSchemaChanged() {
		const argsSchemaNonParallel = await getArgsSchemaNonParallel(true);
		if (argsSchemaNonParallel instanceof Error) {
			formErrorHandler.addValidationError(
				'args_schema_non_parallel',
				argsSchemaNonParallel.message
			);
		}
	}

	async function handleParallelSchemaChanged() {
		const argsSchemaParallel = await getArgsSchemaParallel(true);
		if (argsSchemaParallel instanceof Error) {
			formErrorHandler.addValidationError('args_schema_parallel', argsSchemaParallel.message);
		}
	}

	async function getMetaNonParallel() {
		formErrorHandler.removeValidationError('meta_non_parallel');
		return await getMeta(metaFilesNonParallel);
	}

	async function getMetaParallel() {
		formErrorHandler.removeValidationError('meta_parallel');
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
		} catch {
			return new Error('Unable to read file');
		}
		try {
			return JSON.parse(content);
		} catch {
			return new Error("File doesn't contain valid JSON");
		}
	}

	function clearArgsSchemaNonParallelFileUpload() {
		argsSchemaNonParallelFiles = null;
		if (argsSchemaNonParallelFileInput) {
			argsSchemaNonParallelFileInput.value = '';
		}
		formErrorHandler.removeValidationError('args_schema_non_parallel');
	}

	function clearArgsSchemaParallelFileUpload() {
		argsSchemaParallelFiles = null;
		if (argsSchemaParallelFileInput) {
			argsSchemaParallelFileInput.value = '';
		}
		formErrorHandler.removeValidationError('args_schema_parallel');
	}

	function clearMetaNonParallelFileUpload() {
		metaFilesNonParallel = null;
		if (metaFileInputNonParallel) {
			metaFileInputNonParallel.value = '';
		}
		formErrorHandler.removeValidationError('meta_non_parallel');
	}

	function clearMetaParallelFileUpload() {
		metaFilesParallel = null;
		if (metaFileInputParallel) {
			metaFileInputParallel.value = '';
		}
		formErrorHandler.removeValidationError('meta_parallel');
	}

	function resetFields() {
		name = '';
		command_non_parallel = '';
		command_parallel = '';
		version = '';
		typesEditor?.init({}, {});
		docs_info = '';
		docs_link = '';
		args_schema_version = 'pydantic_v2';
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

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleCreateTask();
	}}
>
	<div class="row mb-1">
		<div class="col-md-6 mb-2">
			<div class="input-group has-validation">
				<label for="task_type" class="input-group-text">Task type</label>
				<select
					class="form-select"
					bind:value={taskType}
					class:is-invalid={$validationErrors['type']}
					id="task_type"
				>
					<option value="non_parallel">Non parallel</option>
					<option value="parallel">Parallel</option>
					<option value="compound">Compound</option>
					<option value="converter_non_parallel">Converter Non Parallel</option>
					<option value="converter_compound">Converter Compound</option>
				</select>
				<span class="invalid-feedback">{$validationErrors['type']}</span>
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
					class:is-invalid={$validationErrors['name']}
					required
				/>
				<span class="invalid-feedback">{$validationErrors['name']}</span>
			</div>
		</div>
	</div>
	{#if isNonParallelType(taskType) || isCompoundType(taskType)}
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
						class:is-invalid={$validationErrors['command_non_parallel']}
						required
					/>
					<span class="invalid-feedback">{$validationErrors['command_non_parallel']}</span>
				</div>
			</div>
		</div>
	{/if}
	{#if isParallelType(taskType) || isCompoundType(taskType)}
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
						class:is-invalid={$validationErrors['command_parallel']}
						required
					/>
					<span class="invalid-feedback">{$validationErrors['command_parallel']}</span>
				</div>
			</div>
		</div>
	{/if}
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
					class:is-invalid={$validationErrors['version']}
				/>
				<span class="invalid-feedback">{$validationErrors['version']}</span>
			</div>
		</div>
	</div>
	{#if isNonParallelType(taskType) || isCompoundType(taskType)}
		<div class="row">
			<div class="col-lg-6 mb-2">
				<div class="input-group has-validation">
					<label for="metaFileNonParallel" class="input-group-text">
						<i class="bi bi-file-earmark-arrow-up"></i> &nbsp; Upload non parallel meta file
					</label>
					<input
						class="form-control schemaFile"
						accept="application/json"
						type="file"
						name="metaFileNonParallel"
						id="metaFileNonParallel"
						bind:this={metaFileInputNonParallel}
						bind:files={metaFilesNonParallel}
						class:is-invalid={$validationErrors['meta_non_parallel']}
					/>
					{#if metaFilesNonParallel && metaFilesNonParallel.length > 0}
						<button class="btn btn-outline-secondary" onclick={clearMetaNonParallelFileUpload}>
							Clear
						</button>
					{/if}
					<span class="invalid-feedback">{$validationErrors['meta_non_parallel']}</span>
				</div>
				<div class="form-text">
					Additional metadata related to execution (e.g. computational resources)
				</div>
			</div>
			<div class="col-lg-6 mb-2">
				<div class="input-group has-validation">
					<label for="argsSchemaNonParallelFile" class="input-group-text">
						<i class="bi bi-file-earmark-arrow-up"></i> &nbsp; Upload non parallel args schema
					</label>
					<input
						class="form-control schemaFile"
						accept="application/json"
						type="file"
						name="argsSchemaNonParallelFile"
						id="argsSchemaNonParallelFile"
						bind:this={argsSchemaNonParallelFileInput}
						bind:files={argsSchemaNonParallelFiles}
						onchange={handleNonParallelSchemaChanged}
						class:is-invalid={$validationErrors['args_schema_non_parallel']}
					/>
					{#if argsSchemaNonParallelFiles && argsSchemaNonParallelFiles.length > 0}
						<button
							class="btn btn-outline-secondary"
							onclick={clearArgsSchemaNonParallelFileUpload}
						>
							Clear
						</button>
					{/if}
					<span class="invalid-feedback">{$validationErrors['args_schema_non_parallel']}</span>
				</div>
				<div class="form-text">JSON schema of task arguments - non parallel</div>
			</div>
		</div>
	{/if}
	{#if isParallelType(taskType) || isCompoundType(taskType)}
		<div class="row">
			<div class="col-lg-6 mb-2">
				<div class="input-group has-validation">
					<label for="metaFileParallel" class="input-group-text">
						<i class="bi bi-file-earmark-arrow-up"></i> &nbsp; Upload parallel meta file
					</label>
					<input
						class="form-control schemaFile"
						accept="application/json"
						type="file"
						name="metaFileParallel"
						id="metaFileParallel"
						bind:this={metaFileInputParallel}
						bind:files={metaFilesParallel}
						class:is-invalid={$validationErrors['meta_parallel']}
					/>
					{#if metaFilesParallel && metaFilesParallel.length > 0}
						<button class="btn btn-outline-secondary" onclick={clearMetaParallelFileUpload}>
							Clear
						</button>
					{/if}
					<span class="invalid-feedback">{$validationErrors['meta_parallel']}</span>
				</div>
				<div class="form-text">
					Additional metadata related to execution (e.g. computational resources)
				</div>
			</div>
			<div class="col-lg-6 mb-2">
				<div class="input-group has-validation">
					<label for="argsSchemaParallelFile" class="input-group-text">
						<i class="bi bi-file-earmark-arrow-up"></i> &nbsp; Upload parallel args schema
					</label>
					<input
						class="form-control schemaFile"
						accept="application/json"
						type="file"
						name="argsSchemaParallelFile"
						id="argsSchemaParallelFile"
						bind:this={argsSchemaParallelFileInput}
						bind:files={argsSchemaParallelFiles}
						onchange={handleParallelSchemaChanged}
						class:is-invalid={$validationErrors['args_schema_parallel']}
					/>
					{#if argsSchemaParallelFiles && argsSchemaParallelFiles.length > 0}
						<button class="btn btn-outline-secondary" onclick={clearArgsSchemaParallelFileUpload}>
							Clear
						</button>
					{/if}
					<span class="invalid-feedback">{$validationErrors['args_schema_parallel']}</span>
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
					<select
						name="args_schema_version"
						id="args_schema_version"
						class="form-select"
						bind:value={args_schema_version}
						class:is-invalid={$validationErrors['args_schema_version']}
						required
					>
						<option>pydantic_v1</option>
						<option>pydantic_v2</option>
					</select>
					<span class="invalid-feedback">{$validationErrors['args_schema_version']}</span>
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
								class:is-invalid={$validationErrors['docs_info']}
								rows="10"
							></textarea>
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
									class:is-invalid={$validationErrors['docs_link']}
								/>
								<span class="invalid-feedback">{$validationErrors['docs_link']}</span>
							</div>
							<div class="form-text">Link to task docs</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<TaskGroupSelector
		id="add-single-task"
		groupIdsNames={user.group_ids_names || []}
		bind:privateTask
		bind:selectedGroup
	/>

	<div class="row">
		<div id="errorAlert-createTask"></div>
		<div class="col-auto">
			<button type="submit" class="btn btn-primary mt-1 mb-3">Create</button>
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
