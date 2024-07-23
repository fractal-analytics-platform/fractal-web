<script>
	import {
		deepCopy,
		getPropertiesToIgnore,
		getValidationErrorMessage,
		JSchema,
		SchemaValidator,
		stripNullAndEmptyObjectsAndArrays
	} from 'fractal-jschema';
	import manifestSchema from './manifest_v2.json';
	import { adaptJsonSchema } from 'fractal-jschema/components/jschema_adapter';
	import { tick } from 'svelte';
	import DragAndDropUploader from './DragAndDropUploader.svelte';

	let manifest = null;
	/** @type {string[]} */
	let tasks = [];
	let selectedTaskName = '';
	let selectedSchema;
	/** @type {'pydantic_v1'|'pydantic_v2'} */
	let schemaVersion = 'pydantic_v1';
	/** @type {'parallel'|'non_parallel'} */
	let selectedSchemaType = 'non_parallel';
	let selectedTask;
	let schemaData = undefined;
	let jsonDataString = '';
	let dataError = '';

	let hasNonParallelArgsSchema = false;
	let hasParallelArgsSchema = false;

	let validationError = '';
	let valid = false;

	function clearFields() {
		manifest = null;
		valid = false;
		validationError = '';
		tasks = [];
		selectedTaskName = '';
		selectedSchema = null;
		selectedTask = null;
		dataError = '';
	}

	function validate() {
		try {
			validationError = '';
			valid = false;
			jschemaComponent?.validateArguments();
			valid = true;
		} catch (err) {
			validationError = getValidationErrorMessage(err);
		}
	}

	/** @type {JSchema|undefined} */
	let jschemaComponent = undefined;

	/**
	 * @param {string} content
	 * @returns {object}
	 */
	function validateManifestContent(content) {
		let manifestData;
		try {
			manifestData = JSON.parse(content);
		} catch (err) {
			throw new Error("File doesn't contain valid JSON");
		}
		if (
			manifestData.args_schema_version !== 'pydantic_v2' &&
			manifestData.args_schema_version !== 'pydantic_v1'
		) {
			throw new Error('Unsupported manifest args schema version');
		}
		schemaVersion = manifestData.args_schema_version;
		if (!isManifestValid(manifestData)) {
			throw new Error('Invalid manifest format');
		} else if (manifestData.manifest_version !== '2') {
			throw new Error('Unsupported manifest version');
		}
		return manifestData;
	}

	function onManifestChange({ detail }) {
		if (detail.value === null) {
			clearFields();
		} else {
			loadManifest(detail.value);
		}
	}

	/**
	 * @param {object} data
	 */
	function isManifestValid(data) {
		const validator = new SchemaValidator(schemaVersion);
		validator.loadSchema(manifestSchema);
		return validator.isValid(data);
	}

	/**
	 * @param {object} manifestData
	 */
	function loadManifest(manifestData) {
		manifest = manifestData;
		tasks = manifest.task_list.map((t) => t.name);
	}

	/**
	 * @param {'parallel'|'non_parallel'|undefined} type
	 */
	async function loadTaskSchema(type = undefined) {
		dataError = '';
		validationError = '';
		valid = false;
		if (!selectedTaskName) {
			selectedSchema = null;
			selectedTask = null;
			return;
		}
		selectedTask = manifest.task_list.filter((t) => t.name === selectedTaskName)[0];
		hasNonParallelArgsSchema = hasArgsSchema(selectedTask.args_schema_non_parallel);
		hasParallelArgsSchema = hasArgsSchema(selectedTask.args_schema_parallel);
		if (type) {
			selectedSchemaType = type;
		} else {
			if (hasNonParallelArgsSchema) {
				selectedSchemaType = 'non_parallel';
			} else {
				selectedSchemaType = 'parallel';
			}
		}
		if (selectedSchemaType === 'non_parallel') {
			selectedSchema = selectedTask.args_schema_non_parallel;
		} else {
			selectedSchema = selectedTask.args_schema_parallel;
		}
		await loadInitialData();
	}

	/**
	 * @param {object|undefined} argsSchema
	 */
	function hasArgsSchema(argsSchema) {
		if (!argsSchema) {
			return false;
		}
		const adaptedSchema = adaptJsonSchema(argsSchema, propertiesToIgnore);
		return Object.keys(adaptedSchema.properties).length > 0;
	}

	function handleDataStringChanged() {
		validationError = '';
		dataError = '';
		try {
			schemaData = JSON.parse(jsonDataString);
		} catch (err) {
			schemaData = undefined;
			dataError = 'Invalid JSON';
		}
	}

	async function loadInitialData() {
		await tick();
		if (!jschemaComponent) {
			return;
		}
		updateData(jschemaComponent.getArguments());
	}

	function detectChange({ detail }) {
		updateData(detail.value);
	}

	/**
	 * @param {object} newData
	 */
	function updateData(newData) {
		const newDataCopy = deepCopy(newData);
		const updatedOldData = JSON.stringify(stripNullAndEmptyObjectsAndArrays(newDataCopy), null, 2);
		// Update the data only if something is changed, to avoid triggering uneccessary events
		if (updatedOldData !== jsonDataString) {
			jsonDataString = updatedOldData;
		}
	}

	$: propertiesToIgnore = getPropertiesToIgnore(false);
</script>

<h1 class="fw-light">Sandbox page for task package manifest</h1>
<p>This is a test page for the JSON Schema form of a whole task package manifest</p>

<div class="row">
	<div class="col-lg-7">
		<DragAndDropUploader
			description="Upload manifest file"
			accept="application/json"
			id="manifestFileUpload"
			validateFile={validateManifestContent}
			on:change={onManifestChange}
		/>
		<div class="form-text">An entire task package manifest</div>
	</div>

	<div class="col-lg-5">
		{#if tasks.length > 0}
			<div class="input-group">
				<label for="selectedTask" class="input-group-text"> Task </label>
				<select
					class="form-control"
					name="selectedTask"
					id="selectedTask"
					bind:value={selectedTaskName}
					on:change={() => loadTaskSchema()}
				>
					<option value="">Select...</option>
					{#each tasks as task}
						<option>{task}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>
</div>

{#if selectedSchema && selectedTask}
	<div class="row mt-3">
		<div class="col-md-6">
			<div class="form-check form-check-inline">
				<input
					class="form-check-input"
					type="radio"
					name="schemaTypeSelector"
					id="schemaNonParallelSelector"
					value="non_parallel"
					bind:group={selectedSchemaType}
					disabled={!hasNonParallelArgsSchema}
					on:change={() => loadTaskSchema('non_parallel')}
				/>
				<label class="form-check-label" for="schemaNonParallelSelector">non parallel</label>
			</div>
			<div class="form-check form-check-inline">
				<input
					class="form-check-input"
					type="radio"
					name="schemaTypeSelector"
					id="schemaParallelSelector"
					value="parallel"
					bind:group={selectedSchemaType}
					disabled={!hasParallelArgsSchema}
					on:change={() => loadTaskSchema('parallel')}
				/>
				<label class="form-check-label" for="schemaParallelSelector">parallel</label>
			</div>
		</div>
	</div>

	<div class="row mt-2 mb-3">
		<div class="col-lg-6">
			<div class="row">
				<div class="col">
					<label for="jschema">JSON Schema</label>
					<textarea
						id="jschema"
						class="form-control"
						value={JSON.stringify(selectedSchema, null, 2)}
						rows="10"
						disabled
					/>
				</div>
			</div>
			<div class="row has-validation mt-3 mb-2">
				<div class="col">
					<label for="jdata">Initial JSON data</label>
					<textarea
						id="jdata"
						class="form-control"
						bind:value={jsonDataString}
						on:input={handleDataStringChanged}
						class:is-invalid={dataError}
						rows="10"
					/>
					<span class="invalid-feedback">{dataError}</span>
				</div>
			</div>
			<div class="row mt-3 mb-2">
				<div class="col">
					{#if validationError}
						<div class="alert alert-danger">
							<pre>{validationError}</pre>
						</div>
					{/if}
					{#if valid}
						<div class="alert alert-success">Data is valid</div>
					{/if}
					<button class="btn btn-primary" on:click={validate}>Validate</button>
				</div>
			</div>
		</div>
		<div class="col-lg-6">
			<JSchema
				componentId="json-schema-task-manifest-sandbox"
				on:change={detectChange}
				schema={selectedSchema}
				{schemaVersion}
				{schemaData}
				{propertiesToIgnore}
				bind:this={jschemaComponent}
			/>
		</div>
	</div>
{/if}
