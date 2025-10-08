<script>
	import {
		JSchema,
		SchemaValidator,
		stripNullAndEmptyObjectsAndArrays,
		deepCopy,
		getValidationErrorMessage,
		stripIgnoredProperties,
		getPropertiesToIgnore,
		detectSchemaVersion
	} from 'fractal-components';
	import { tick } from 'svelte';

	let oldSchema = $state(undefined);
	let oldSchemaData = $state(undefined);

	let oldJsonSchemaString = $state('');
	let oldJsonDataString = $state('');

	let oldJsonSchemaError = $state('');
	let oldDataError = $state('');

	/** @type {'pydantic_v1'|'pydantic_v2'} */
	let oldSchemaVersion = $state('pydantic_v2');

	/** @type {JSchema|undefined} */
	let oldJschemaComponent = $state(undefined);

	let newSchema = $state(undefined);

	/** @type {'pydantic_v1'|'pydantic_v2'} */
	let newSchemaVersion = $state('pydantic_v2');

	let newJsonSchemaString = $state('');
	let newJsonSchemaError = $state('');

	let dummyWorkflowTask = $state(undefined);
	let dummyUpdateCandidate = $state(undefined);

	async function handleOldJsonSchemaStringChanged() {
		oldJsonSchemaError = '';
		if (oldJsonSchemaString === '') {
			oldSchema = undefined;
			return;
		}
		try {
			oldSchema = JSON.parse(oldJsonSchemaString);
			handleOldDataChanged();
		} catch (err) {
			oldSchema = undefined;
			oldJsonSchemaError = 'Invalid JSON';
		}

		try {
			const schemaValidator = new SchemaValidator(oldSchemaVersion);
			schemaValidator.validateSchema(oldSchema);
		} catch (_) {
			try {
				oldSchemaVersion = detectSchemaVersion(oldSchema);
			} catch (err) {
				oldSchema = undefined;
				oldJsonSchemaError = `Invalid JSON Schema: ${/** @type {Error} */ (err).message}`;
				return;
			}
		}
	}

	function handleOldDataStringChanged() {
		oldDataError = '';
		oldDataError = '';
		try {
			oldSchemaData = JSON.parse(oldJsonDataString);
		} catch (err) {
			oldSchemaData = undefined;
			oldDataError = 'Invalid JSON';
		}
	}

	function handleNewJsonSchemaStringChanged() {
		dummyWorkflowTask = undefined;
		dummyUpdateCandidate = undefined;
		newJsonSchemaError = '';
		if (newJsonSchemaString === '') {
			newSchema = undefined;
			return;
		}
		try {
			newSchema = JSON.parse(newJsonSchemaString);
		} catch (err) {
			newSchema = undefined;
			newJsonSchemaError = 'Invalid JSON';
		}

		try {
			const schemaValidator = new SchemaValidator(newSchemaVersion);
			schemaValidator.validateSchema(newSchema);
		} catch (_) {
			try {
				newSchemaVersion = detectSchemaVersion(newSchema);
			} catch (err) {
				newSchema = undefined;
				newJsonSchemaError = `Invalid JSON Schema: ${/** @type {Error} */ (err).message}`;
				return;
			}
		}
	}

	/** @type {string} */
	let errorOld = $state();
	let oldValid = $state(false);

	async function validate() {
		try {
			errorOld = '';
			oldValid = false;
			oldSchemaData = JSON.parse(oldJsonDataString);
			await tick();
			oldJschemaComponent?.validateArguments();
			oldValid = true;
		} catch (err) {
			errorOld = getValidationErrorMessage(err);
			dummyWorkflowTask = undefined;
			dummyUpdateCandidate = undefined;
		}
	}

	async function handleOldDataChanged() {
		await tick();
		if (!oldJschemaComponent) {
			return;
		}
		const deepCopyArgs = deepCopy(oldJschemaComponent.getArguments());
		const updatedOldData = JSON.stringify(stripNullAndEmptyObjectsAndArrays(deepCopyArgs), null, 2);
		// Update the data only if something is changed, to avoid triggering uneccessary events
		if (updatedOldData !== oldJsonDataString) {
			oldJsonDataString = updatedOldData;
		}
	}

	async function tryVersionUpdate() {
		displayTextarea = false;
		if (!oldValid) {
			await validate();
		}
		if (!oldValid) {
			return;
		}
		createDummyObjects();
		await tick();
		checkArgumentsWithNewSchema();
	}

	function createDummyObjects() {
		dummyWorkflowTask = {
			id: 1,
			args_parallel: deepCopy(oldSchemaData),
			task_type: 'parallel'
		};

		dummyUpdateCandidate = {
			args_schema_parallel: newSchema
		};
	}

	function loadExample() {
		oldSchemaVersion = 'pydantic_v2';
		newSchemaVersion = 'pydantic_v2';
		const oldSchemaExample = {
			title: 'Test',
			type: 'object',
			properties: { foo: { title: 'foo', type: 'string' } },
			required: ['foo']
		};
		const newSchemaExample = deepCopy(oldSchemaExample);
		newSchemaExample.properties.bar = { title: 'bar', type: 'string' };
		newSchemaExample.required.push('bar');
		oldJsonSchemaString = JSON.stringify(oldSchemaExample, null, 2);
		oldJsonDataString = JSON.stringify({ foo: 'something' }, null, 2);
		newJsonSchemaString = JSON.stringify(newSchemaExample, null, 2);
		handleOldJsonSchemaStringChanged();
		handleOldDataStringChanged();
		handleNewJsonSchemaStringChanged();
	}

	let canBeUpdated = $state(false);
	let argsChanged = $state(false);

	let originalArgs = $state('');
	let displayTextarea = $state(false);
	let argsToBeFixed = $state('');
	let argsToBeFixedValidJson = $state(true);
	let validationErrors = $state(null);

	export function reset() {
		argsToBeFixed = '';
		validationErrors = null;
	}

	export function cancel() {
		argsToBeFixed = originalArgs;
		check();
	}

	export function check() {
		if (!argsToBeFixed) {
			return;
		}
		argsToBeFixedValidJson = true;
		let args;
		try {
			args = JSON.parse(argsToBeFixed);
		} catch (err) {
			argsToBeFixedValidJson = false;
			return;
		}
		validateArguments(args);
	}

	export function checkArgumentsWithNewSchema() {
		const oldArgs = dummyWorkflowTask.args_parallel || {};
		originalArgs = JSON.stringify(oldArgs, null, 2);
		validateArguments(oldArgs);
	}

	export function getNewArgs() {
		argsToBeFixed !== '' ? JSON.parse(argsToBeFixed) : dummyWorkflowTask.args_parallel || {};
	}

	/**
	 * @param {object} args
	 */
	function validateArguments(args) {
		const newSchema = dummyUpdateCandidate.args_schema_parallel;
		const validator = new SchemaValidator(newSchemaVersion, true);
		if ('properties' in newSchema) {
			stripIgnoredProperties(/**@type {any}*/ (newSchema), getPropertiesToIgnore(false));
		}
		const parsedSchema = deepCopy(newSchema);
		const isSchemaValid = validator.loadSchema(parsedSchema);
		if (!isSchemaValid) {
			throw new Error('Invalid JSON schema');
		}
		const valid = validator.isValid(args);
		if (valid) {
			validationErrors = null;
		} else {
			argsToBeFixed = JSON.stringify(args, null, 2);
			displayTextarea = true;
			validationErrors = validator.getErrors();
		}
	}

	export function hasValidationErrors() {
		return (validationErrors?.length || 0) > 0;
	}

	$effect(() => {
		canBeUpdated = validationErrors === null || validationErrors.length === 0;
		argsChanged = argsToBeFixed !== originalArgs;
	});

	let propertiesToIgnore = $derived(getPropertiesToIgnore(false));
</script>

<h1 class="fw-light">Sandbox page for task version update</h1>
<p>This is a test page for the task version update</p>

<div class="row">
	<div class="col-lg-6 mt-3">
		<h2>Old schema</h2>
		<div class="form-check form-check-inline">
			<input
				class="form-check-input"
				type="radio"
				name="oldSchemaVersionOptions"
				id="old_pydantic_v1"
				value="pydantic_v1"
				bind:group={oldSchemaVersion}
				onchange={handleOldJsonSchemaStringChanged}
			/>
			<label class="form-check-label" for="old_pydantic_v1">pydantic_v1</label>
		</div>
		<div class="form-check form-check-inline">
			<input
				class="form-check-input"
				type="radio"
				name="oldSchemaVersionOptions"
				id="old_pydantic_v2"
				value="pydantic_v2"
				bind:group={oldSchemaVersion}
				onchange={handleOldJsonSchemaStringChanged}
			/>
			<label class="form-check-label" for="old_pydantic_v2">pydantic_v2</label>
		</div>
	</div>
	<div class="col-lg-6 mt-5">
		<button class="btn btn-outline-primary" onclick={loadExample}> Load example </button>
	</div>
</div>

<div class="row">
	<div class="col-lg-6 mt-3">
		<div class="row has-validation mb-2">
			<div class="col">
				<label for="jschema-old">JSON Schema</label>
				<textarea
					id="jschema-old"
					class="form-control"
					bind:value={oldJsonSchemaString}
					oninput={handleOldJsonSchemaStringChanged}
					class:is-invalid={oldJsonSchemaError}
					rows="10"
				></textarea>
				<span class="invalid-feedback">{oldJsonSchemaError}</span>
			</div>
		</div>
		<div class="row has-validation mt-3 mb-2">
			<div class="col">
				<label for="jdata-old">Initial JSON data</label>
				<textarea
					id="jdata-old"
					class="form-control"
					bind:value={oldJsonDataString}
					oninput={handleOldDataStringChanged}
					class:is-invalid={oldDataError}
					rows="10"
				></textarea>
				<span class="invalid-feedback">{oldDataError}</span>
			</div>
		</div>
		<div class="row mt-3 mb-2">
			<div class="col">
				{#if errorOld}
					<div class="alert alert-danger">
						<pre>{errorOld}</pre>
					</div>
				{/if}
				{#if oldValid}
					<div class="alert alert-success">Data is valid</div>
				{/if}
				<button class="btn btn-primary" onclick={validate}>Validate</button>
			</div>
		</div>
	</div>
	<div class="col-lg-6 mt-3">
		{#if oldSchema}
			<JSchema
				componentId="json-schema-version-update-sandbox"
				schema={oldSchema}
				schemaData={oldSchemaData}
				schemaVersion={oldSchemaVersion}
				onchange={handleOldDataChanged}
				{propertiesToIgnore}
				bind:this={oldJschemaComponent}
			/>
		{/if}
	</div>
</div>

<hr />

<div class="row">
	<div class="col-lg-6 mt-2">
		<h2>New schema</h2>
		<div class="form-check form-check-inline">
			<input
				class="form-check-input"
				type="radio"
				name="newSchemaVersionOptions"
				id="new_pydantic_v1"
				value="pydantic_v1"
				bind:group={newSchemaVersion}
				onchange={handleNewJsonSchemaStringChanged}
			/>
			<label class="form-check-label" for="new_pydantic_v1">pydantic_v1</label>
		</div>
		<div class="form-check form-check-inline">
			<input
				class="form-check-input"
				type="radio"
				name="newSchemaVersionOptions"
				id="new_pydantic_v2"
				value="pydantic_v2"
				bind:group={newSchemaVersion}
				onchange={handleNewJsonSchemaStringChanged}
			/>
			<label class="form-check-label" for="new_pydantic_v2">pydantic_v2</label>
		</div>
	</div>
</div>

<div class="row mb-5">
	<div class="col-lg-6 mt-3">
		<div class="row has-validation mb-2">
			<div class="col">
				<label for="jschema-new">JSON Schema</label>
				<textarea
					id="jschema-new"
					class="form-control"
					bind:value={newJsonSchemaString}
					oninput={handleNewJsonSchemaStringChanged}
					class:is-invalid={newJsonSchemaError}
					rows="10"
				></textarea>
				<span class="invalid-feedback">{newJsonSchemaError}</span>
			</div>
		</div>
	</div>
	<div class="col-lg-6">
		{#if newSchema}
			<button class="btn btn-primary mt-4 mb-2" onclick={tryVersionUpdate}>
				Try version update
			</button>
			{#if dummyWorkflowTask && dummyUpdateCandidate}
				{#if validationErrors}
					<div class="alert alert-danger mt-3">
						<p>Following errors must be fixed before performing the update:</p>
						<ul id="validation-errors">
							{#each validationErrors as error, index}
								<li>
									{#if error.instancePath}
										{error.instancePath}:
									{/if}
									{#if error.keyword === 'additionalProperties'}
										must NOT have additional property '{error.params.additionalProperty}'
									{:else}
										{error.message}
									{/if}
									<small
										data-bs-toggle="collapse"
										data-bs-target="#collapse-{index}"
										aria-expanded="true"
										aria-controls="collapse-{index}"
										class="text-primary"
										role="button"
									>
										more
									</small>
									<div
										id="collapse-{index}"
										class="accordion-collapse collapse"
										data-bs-parent="#validation-errors"
									>
										<div class="accordion-body">
											<pre class="alert alert-warning mt-1">{JSON.stringify(error, null, 2)}</pre>
										</div>
									</div>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				{#if originalArgs}
					{#if !validationErrors}
						<div class="alert alert-success mt-3">The arguments are valid</div>
					{/if}
					{#if displayTextarea}
						<label class="form-label" for="fix-arguments"> Fix the arguments: </label>
						<textarea
							class="form-control"
							id="fix-arguments"
							class:is-invalid={!argsToBeFixedValidJson}
							bind:value={argsToBeFixed}
							rows="20"
						></textarea>
					{/if}
					{#if !argsToBeFixedValidJson}
						<div class="invalid-feedback">Invalid JSON</div>
					{/if}
				{/if}
				{#if displayTextarea}
					<button type="button" class="btn btn-warning mt-3" onclick={check}> Check </button>
				{/if}
			{/if}
		{/if}
	</div>
</div>
