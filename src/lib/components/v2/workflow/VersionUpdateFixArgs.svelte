<script>
	import { deepCopy } from '$lib/common/component_utilities';
	import { AlertError } from '$lib/common/errors';
	import { stripIgnoredProperties, getPropertiesToIgnore, SchemaValidator } from 'fractal-jschema';

	/** @type {import('$lib/types-v2').WorkflowTaskV2} */
	export let workflowTask;
	/** @type {import('$lib/types').Task|import('$lib/types-v2').TaskV2} */
	export let updateCandidate;
	/** @type {boolean} */
	export let parallel;

	export let canBeUpdated = false;
	export let argsChanged = false;

	$: {
		canBeUpdated = validationErrors === null || validationErrors.length === 0;
		argsChanged = argsToBeFixed !== originalArgs;
	}

	let originalArgs = '';
	let displayTextarea = false;
	let argsToBeFixed = '';
	let argsToBeFixedValidJson = true;
	/** @type {import('ajv').ErrorObject[] | null} */
	let validationErrors = null;

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
		const oldArgs = (parallel ? workflowTask.args_parallel : workflowTask.args_non_parallel) || {};
		originalArgs = JSON.stringify(oldArgs, null, 2);
		validateArguments(oldArgs);
		return displayTextarea;
	}

	export function getNewArgs() {
		argsToBeFixed !== ''
			? JSON.parse(argsToBeFixed)
			: (parallel ? workflowTask.args_parallel : workflowTask.args_non_parallel) || {};
	}

	/**
	 * @param {object} args
	 */
	function validateArguments(args) {
		let newSchema =
			/** @type {import('fractal-jschema/types/jschema').JSONSchemaObjectProperty} */ (
				'args_schema' in updateCandidate
					? updateCandidate.args_schema
					: parallel
					? updateCandidate.args_schema_parallel
					: updateCandidate.args_schema_non_parallel
			);
		const validator = new SchemaValidator(updateCandidate.args_schema_version, true);
		if ('properties' in newSchema) {
			newSchema = stripIgnoredProperties(
				newSchema,
				getPropertiesToIgnore(false)
			);
		}
		const parsedSchema = deepCopy(newSchema);
		const isSchemaValid = validator.loadSchema(parsedSchema);
		if (!isSchemaValid) {
			throw new AlertError('Invalid JSON schema');
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
		<div class="alert alert-success mt-3">The arguments are valid</div>
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
		/>
	{/if}
	{#if !argsToBeFixedValidJson}
		<div class="invalid-feedback">Invalid JSON</div>
	{/if}
{/if}
