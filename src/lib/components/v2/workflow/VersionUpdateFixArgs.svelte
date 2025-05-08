<script>
	import { deepCopy } from '$lib/common/component_utilities';
	import { AlertError } from '$lib/common/errors';
	import {
		stripIgnoredProperties,
		getPropertiesToIgnore,
		SchemaValidator,
		stripNullAndEmptyObjectsAndArrays,
		isCompoundType
	} from 'fractal-components';
	import { getJsonSchemaData } from 'fractal-components/jschema/jschema_initial_data';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').WorkflowTaskV2} workflowTask
	 * @property {import('fractal-components/types/api').TaskV2} updateCandidate
	 * @property {boolean} parallel
	 * @property {boolean} [canBeUpdated]
	 * @property {boolean} [argsChanged]
	 */

	/** @type {Props} */
	let {
		workflowTask,
		updateCandidate,
		parallel,
		canBeUpdated = $bindable(false),
		argsChanged = $bindable(false)
	} = $props();

	let originalArgs = $state('');
	let displayTextarea = $state(false);
	let argsToBeFixed = $state('');
	let argsToBeFixedValidJson = $state(true);
	/** @type {import('ajv').ErrorObject[] | undefined} */
	let validationErrors = $state();

	export function reset() {
		argsToBeFixed = '';
		validationErrors = undefined;
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
		} catch {
			argsToBeFixedValidJson = false;
			return;
		}
		validateArguments(args);
	}

	export function checkArgumentsWithNewSchema() {
		const oldArgs = (parallel ? workflowTask.args_parallel : workflowTask.args_non_parallel) || {};
		originalArgs = JSON.stringify(oldArgs, null, 2);
		const newArgs = { ...getDefaultValues(), ...oldArgs };
		validateArguments(newArgs);
		return displayTextarea;
	}

	export function getNewArgs() {
		if (argsToBeFixed !== '') {
			return JSON.parse(argsToBeFixed);
		}
		const args = (parallel ? workflowTask.args_parallel : workflowTask.args_non_parallel) || {};
		return { ...getDefaultValues(), ...args };
	}

	function getDefaultValues() {
		const newSchema = getNewSchema();
		const schemaDefaultData = getJsonSchemaData(newSchema, updateCandidate.args_schema_version);
		return stripNullAndEmptyObjectsAndArrays(schemaDefaultData || {});
	}

	/**
	 * @param {object} args
	 */
	function validateArguments(args) {
		const newSchema = getNewSchema();
		const validator = new SchemaValidator(updateCandidate.args_schema_version, true);
		const isSchemaValid = validator.loadSchema(newSchema);
		if (!isSchemaValid) {
			throw new AlertError('Invalid JSON schema');
		}
		const valid = validator.isValid(args);
		if (valid) {
			validationErrors = undefined;
		} else {
			argsToBeFixed = JSON.stringify(args, null, 2);
			displayTextarea = true;
			validationErrors = validator.getErrors() || undefined;
		}
	}

	function getNewSchema() {
		let newSchema =
			/** @type {import('fractal-components/types/jschema').JSONSchemaObjectProperty} */ (
				'args_schema' in updateCandidate
					? updateCandidate.args_schema
					: parallel
						? updateCandidate.args_schema_parallel
						: updateCandidate.args_schema_non_parallel
			);
		if ('properties' in newSchema) {
			newSchema = stripIgnoredProperties(newSchema, getPropertiesToIgnore(false));
		}
		return deepCopy(newSchema);
	}

	export function hasValidationErrors() {
		return (validationErrors?.length || 0) > 0;
	}

	$effect(() => {
		canBeUpdated = validationErrors === undefined || validationErrors.length === 0;
	});

	$effect(() => {
		argsChanged = argsToBeFixed !== originalArgs;
	});
</script>

{#if validationErrors}
	<div class="alert alert-danger mt-3">
		<p>Following errors must be fixed before performing the update:</p>
		<ul id="validation-errors">
			{#each validationErrors as error, index}
				<li>
					{#if error.instancePath !== ''}
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
		<div class="alert alert-success mt-3">
			{#if isCompoundType(workflowTask.task_type)}
				The {parallel ? '' : ' non'} parallel arguments are valid
			{:else}
				The arguments are valid
			{/if}
		</div>
	{/if}
	{#if displayTextarea}
		<label class="form-label" for="fix-arguments-{parallel ? 'parallel' : 'non-parallel'}">
			Fix the {parallel ? '' : ' non'} parallel arguments:
		</label>
		<textarea
			class="form-control"
			id="fix-arguments-{parallel ? 'parallel' : 'non-parallel'}"
			class:is-invalid={!argsToBeFixedValidJson}
			bind:value={argsToBeFixed}
			rows="20"
		></textarea>
	{/if}
	{#if !argsToBeFixedValidJson}
		<div class="invalid-feedback">Invalid JSON</div>
	{/if}
{/if}
