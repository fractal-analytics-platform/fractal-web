<script>
	import {
		JSchema,
		stripNullAndEmptyObjectsAndArrays,
		deepCopy,
		getValidationErrorMessage,
		getPropertiesToIgnore,
		detectSchemaVersion,
		SchemaValidator
	} from 'fractal-components';
	import { tick } from 'svelte';
	import example from './example.json';

	let schema = $state();
	let schemaData = $state();

	let jsonSchemaString = $state('');
	let jsonDataString = $state('');

	let jsonSchemaError = $state('');
	let dataError = $state('');

	/** @type {'pydantic_v1'|'pydantic_v2'} */
	let schemaVersion = $state('pydantic_v2');

	/** @type {JSchema|undefined} */
	let jschemaComponent = $state();

	function handleJsonSchemaStringChanged() {
		validationError = '';
		jsonSchemaError = '';
		if (jsonSchemaString === '') {
			schema = undefined;
			return;
		}
		let parsedSchema;
		try {
			parsedSchema = JSON.parse(jsonSchemaString);
		} catch (err) {
			schema = undefined;
			jsonSchemaError = 'Invalid JSON';
			return;
		}

		try {
			const schemaValidator = new SchemaValidator(schemaVersion);
			schemaValidator.validateSchema(parsedSchema);
		} catch (_) {
			try {
				schemaVersion = detectSchemaVersion(parsedSchema);
			} catch (err) {
				schema = undefined;
				jsonSchemaError = `Invalid JSON Schema: ${/** @type {Error} */ (err).message}`;
				return;
			}
		}

		schema = parsedSchema;
		handleDataChanged();
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

	let validationError = $state('');
	let valid = $state(false);

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

	function loadExample() {
		schemaVersion = 'pydantic_v2';
		jsonSchemaString = JSON.stringify(example, null, 2);
		handleJsonSchemaStringChanged();
	}

	async function handleDataChanged() {
		await tick();
		if (!jschemaComponent) {
			return;
		}
		updateData(jschemaComponent.getArguments());
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

	let propertiesToIgnore = $derived(getPropertiesToIgnore(false));
</script>

<h1 class="fw-light">Sandbox page for JSON Schema</h1>
<p>This is a test page for the JSON Schema component</p>

<div class="row">
	<div class="col-lg-6 mt-3">
		<div class="row">
			<div class="col">
				<div class="form-check form-check-inline">
					<input
						class="form-check-input"
						type="radio"
						name="schemaVersionOptions"
						id="pydantic_v1"
						value="pydantic_v1"
						bind:group={schemaVersion}
						onchange={handleJsonSchemaStringChanged}
					/>
					<label class="form-check-label" for="pydantic_v1">pydantic_v1</label>
				</div>
				<div class="form-check form-check-inline">
					<input
						class="form-check-input"
						type="radio"
						name="schemaVersionOptions"
						id="pydantic_v2"
						value="pydantic_v2"
						bind:group={schemaVersion}
						onchange={handleJsonSchemaStringChanged}
					/>
					<label class="form-check-label" for="pydantic_v2">pydantic_v2</label>
				</div>
				<button class="btn btn-outline-primary float-end" onclick={loadExample}>
					Load example
				</button>
			</div>
		</div>
		<div class="row has-validation mt-2 mb-2">
			<div class="col">
				<label for="json-schema">JSON Schema</label>
				<textarea
					id="json-schema"
					class="form-control"
					bind:value={jsonSchemaString}
					oninput={handleJsonSchemaStringChanged}
					class:is-invalid={jsonSchemaError}
					rows="10"
				></textarea>
				<span class="invalid-feedback">{jsonSchemaError}</span>
			</div>
		</div>
		<div class="row has-validation mt-3 mb-2">
			<div class="col">
				<label for="jdata">Initial JSON data</label>
				<textarea
					id="jdata"
					class="form-control"
					bind:value={jsonDataString}
					oninput={handleDataStringChanged}
					class:is-invalid={dataError}
					rows="10"
				></textarea>
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
				<button class="btn btn-primary" onclick={validate}>Validate</button>
			</div>
		</div>
	</div>
	<div class="col-lg-6">
		{#if schema && !jsonSchemaError}
			<JSchema
				componentId="json-schema-sandbox"
				onchange={updateData}
				{schema}
				{schemaVersion}
				{schemaData}
				{propertiesToIgnore}
				bind:this={jschemaComponent}
			/>
		{/if}
	</div>
</div>
