<script>
	import {
		JSchema,
		SchemaValidator,
		stripNullAndEmptyObjectsAndArrays,
		deepCopy,
		getValidationErrorMessage,
		getPropertiesToIgnore
	} from 'fractal-jschema';
	import { tick } from 'svelte';
	import example from './example.json';

	let schema = undefined;
	let schemaData = undefined;

	let jsonSchemaString = '';
	let jsonDataString = '';

	let jsonSchemaError = '';
	let dataError = '';

	let legacy = false;

	/** @type {JSchema|undefined} */
	let jschemaComponent = undefined;

	function handleJsonSchemaStringChanged() {
		validationError = '';
		jsonSchemaError = '';
		if (jsonSchemaString === '') {
			schema = undefined;
			return;
		}
		try {
			schema = JSON.parse(jsonSchemaString);
			handleDataChanged();
		} catch (err) {
			schema = undefined;
			jsonSchemaError = 'Invalid JSON';
		}
		const validator = new SchemaValidator();
		if (!validator.loadSchema(schema)) {
			schema = undefined;
			jsonSchemaError = 'Invalid JSON Schema';
		}
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

	function forceRedraw() {
		handleJsonSchemaStringChanged();
		handleDataStringChanged();
	}

	let validationError = '';
	let valid = false;

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

	$: propertiesToIgnore = getPropertiesToIgnore(legacy);
</script>

<div class="row">
	<div class="col-lg-6 mt-3">
		<div class="row">
			<div class="col">
				<button class="btn btn-outline-primary float-end" on:click={loadExample}>
					Load example
				</button>
				<div class="form-check form-switch">
					<input
						class="form-check-input"
						type="checkbox"
						role="switch"
						id="legacy"
						bind:checked={legacy}
						on:change={forceRedraw}
					/>
					<label class="form-check-label" for="legacy"> Legacy</label>
				</div>
				<div class="form-text">Changes the set of ignored properties (v1 or v2)</div>
			</div>
		</div>
		<div class="row has-validation mt-3 mb-2">
			<div class="col">
				<label for="jschema">JSON Schema</label>
				<textarea
					id="jschema"
					class="form-control"
					bind:value={jsonSchemaString}
					on:input={handleJsonSchemaStringChanged}
					class:is-invalid={jsonSchemaError}
					rows="10"
				/>
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
	<div class="col-lg-6 mt-3">
		{#if schema}
			<JSchema
				componentId="json-schema-sandbox"
				on:change={detectChange}
				{schema}
				{schemaData}
				{propertiesToIgnore}
				bind:this={jschemaComponent}
			/>
		{/if}
	</div>
</div>
