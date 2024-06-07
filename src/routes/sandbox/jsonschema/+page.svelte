<script>
	import { deepCopy } from '$lib/common/component_utilities';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import { stripNullAndEmptyObjectsAndArrays } from '$lib/components/common/jschema/schema_management';
	import JSchema from '$lib/components/v2/workflow/JSchema.svelte';
	import example from './example.json';

	let schema = undefined;
	let schemaData = {};

	let jsonSchemaString = '';
	let jsonDataString = '{}';

	let jsonSchemaError = '';
	let dataError = '';

	let legacy = false;

	/** @type {JSchema|undefined} */
	let jschemaComponent = undefined;

	function handleJsonSchemaStringChanged() {
		jsonSchemaError = '';
		if (jsonSchemaString === '') {
			schema = undefined;
			return;
		}
		try {
			schema = JSON.parse(jsonSchemaString);
		} catch (err) {
			schema = undefined;
			jsonSchemaError = 'Invalid JSON';
		}
	}

	function handleDataStringChanged() {
		dataError = '';
		dataError = '';
		try {
			schemaData = JSON.parse(jsonDataString);
		} catch (err) {
			schemaData = {};
			dataError = 'Invalid JSON';
		}
	}

	function forceRedraw() {
		handleJsonSchemaStringChanged();
		handleDataStringChanged();
	}

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert;
	let valid = false;

	function validate() {
		try {
			errorAlert?.hide();
			valid = false;
			jschemaComponent?.validateArguments();
			valid = true;
		} catch (err) {
			errorAlert = displayStandardErrorAlert(err, `errorAlert-form`);
		}
	}

	function loadExample() {
		jsonSchemaString = JSON.stringify(example, null, 2);
		handleJsonSchemaStringChanged();
	}

	function loadCurrentData() {
		if (!jschemaComponent) {
			return;
		}
		const deepCopyArgs = deepCopy(jschemaComponent.getArguments());
		jsonDataString = JSON.stringify(stripNullAndEmptyObjectsAndArrays(deepCopyArgs), null, 2);
	}
</script>

<h1 class="fw-light">Sandbox page for JSON Schema</h1>
<p>This is a test page for the JSON Schema component</p>

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
				<div id="errorAlert-form" />
				{#if valid}
					<div class="alert alert-success">Data is valid</div>
				{/if}
				<button class="btn btn-outline-primary float-end" on:click={loadCurrentData}>
					Load current data
				</button>
				<button class="btn btn-primary" on:click={validate}>Validate</button>
			</div>
		</div>
	</div>
	<div class="col-lg-6 mt-3">
		{#if schema}
			<JSchema {schema} {schemaData} {legacy} bind:this={jschemaComponent} />
		{/if}
	</div>
</div>
