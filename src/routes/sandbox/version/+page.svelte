<script>
	import { deepCopy } from '$lib/common/component_utilities';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import { stripNullAndEmptyObjectsAndArrays } from '$lib/components/common/jschema/schema_management';
	import JSchema from '$lib/components/v2/workflow/JSchema.svelte';
	import VersionUpdateFixArgs from '$lib/components/v2/workflow/VersionUpdateFixArgs.svelte';
	import { tick } from 'svelte';

	let oldSchema = undefined;
	let oldSchemaData = {};

	let oldJsonSchemaString = '';
	let oldJsonDataString = '{}';

	let oldJsonSchemaError = '';
	let oldDataError = '';

	let legacy = false;

	/** @type {JSchema|undefined} */
	let oldJschemaComponent = undefined;

	let newSchema = undefined;

	let newJsonSchemaString = '';
	let newJsonSchemaError = '';

	let dummyWorkflowTask = undefined;
	let dummyUpdateCandidate = undefined;

	/** @type {VersionUpdateFixArgs} */
	let fixArgsComponent;

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
	}

	function handleOldDataStringChanged() {
		oldDataError = '';
		oldDataError = '';
		try {
			oldSchemaData = JSON.parse(oldJsonDataString);
		} catch (err) {
			oldSchemaData = {};
			oldDataError = 'Invalid JSON';
		}
	}

	function forceRedrawOld() {
		handleOldJsonSchemaStringChanged();
		handleOldDataStringChanged();
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
	}

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlertOld;
	let oldValid = false;

	async function validate() {
		try {
			errorAlertOld?.hide();
			oldValid = false;
			oldSchemaData = JSON.parse(oldJsonDataString);
			await tick();
			oldJschemaComponent?.validateArguments();
			oldValid = true;
		} catch (err) {
			errorAlertOld = displayStandardErrorAlert(err, `errorAlert-form-old`);
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

	let displayTextarea = false;

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
		displayTextarea = fixArgsComponent.checkArgumentsWithNewSchema();
	}

	function check() {
		fixArgsComponent.check();
	}

	function createDummyObjects() {
		dummyWorkflowTask = {
			id: 1,
			args_parallel: deepCopy(oldSchemaData),
			task_type: 'parallel',
			is_legacy_task: legacy
		};

		dummyUpdateCandidate = {
			args_schema_parallel: newSchema
		};
	}
</script>

<h1 class="fw-light">Sandbox page for task version update</h1>
<p>This is a test page for the task version update</p>

<h2>Old schema</h2>

<div class="row">
	<div class="col-lg-6 mt-3">
		<div class="row">
			<div class="col">
				<div class="form-check form-switch">
					<input
						class="form-check-input"
						type="checkbox"
						role="switch"
						id="legacy"
						bind:checked={legacy}
						on:change={forceRedrawOld}
					/>
					<label class="form-check-label" for="legacy"> Legacy</label>
				</div>
				<div class="form-text">Changes the set of ignored properties (v1 or v2)</div>
			</div>
		</div>
		<div class="row has-validation mt-3 mb-2">
			<div class="col">
				<label for="jschema-old">JSON Schema</label>
				<textarea
					id="jschema-old"
					class="form-control"
					bind:value={oldJsonSchemaString}
					on:input={handleOldJsonSchemaStringChanged}
					class:is-invalid={oldJsonSchemaError}
					rows="10"
				/>
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
					on:input={handleOldDataStringChanged}
					class:is-invalid={oldDataError}
					rows="10"
				/>
				<span class="invalid-feedback">{oldDataError}</span>
			</div>
		</div>
		<div class="row mt-3 mb-2">
			<div class="col">
				<div id="errorAlert-form-old" />
				{#if oldValid}
					<div class="alert alert-success">Data is valid</div>
				{/if}
				<button class="btn btn-primary" on:click={validate}>Validate</button>
			</div>
		</div>
	</div>
	<div class="col-lg-6 mt-3">
		{#if oldSchema}
			<JSchema
				schema={oldSchema}
				schemaData={oldSchemaData}
				{legacy}
				bind:this={oldJschemaComponent}
				on:change={handleOldDataChanged}
			/>
		{/if}
	</div>
</div>

<hr />

<h2 class="mt-2">New schema</h2>

<div class="row">
	<div class="col-lg-6 mt-3">
		<div class="row has-validation mb-2">
			<div class="col">
				<label for="jschema-new">JSON Schema</label>
				<textarea
					id="jschema-new"
					class="form-control"
					bind:value={newJsonSchemaString}
					on:input={handleNewJsonSchemaStringChanged}
					class:is-invalid={newJsonSchemaError}
					rows="10"
				/>
				<span class="invalid-feedback">{newJsonSchemaError}</span>
			</div>
		</div>
	</div>
	<div class="col-lg-6">
		{#if newSchema}
			<button class="btn btn-primary mt-4 mb-2" on:click={tryVersionUpdate}>
				Try version update
			</button>
			{#if dummyWorkflowTask && dummyUpdateCandidate}
				<VersionUpdateFixArgs
					workflowTask={dummyWorkflowTask}
					updateCandidate={dummyUpdateCandidate}
					parallel={true}
					bind:this={fixArgsComponent}
				/>
				{#if displayTextarea}
					<button type="button" class="btn btn-warning mt-3" on:click={check}> Check </button>
				{/if}
			{/if}
		{/if}
	</div>
</div>
