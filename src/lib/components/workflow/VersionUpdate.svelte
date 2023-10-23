<script>
	import { greatestVersionAsc } from '$lib/common/component_utilities';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import { SchemaValidator } from '$lib/common/jschema_validation';
	import { page } from '$app/stores';
	import { stripSchemaProperties } from '../common/jschema/schema_management';

	/** @type {import('$lib/types').WorkflowTask} */
	export let workflowTask;

	/** @type {(workflowTask: import('$lib/types').WorkflowTask) => void} */
	export let updateWorkflowCallback;
	/** @type {(count: number) => void} */
	export let updateNewVersionsCount;

	$: task = workflowTask.task;

	/** @type {import('$lib/types').Task[]} */
	let updateCandidates = [];
	let selectedUpdateVersion = '';
	let argsToBeFixed = '';
	/** @type {import('ajv').ErrorObject[] | null} */
	let validationErrors = null;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	$: {
		if (task) {
			checkNewVersions();
		}
	}

	async function checkNewVersions() {
		if (errorAlert) {
			errorAlert.hide();
		}
		updateCandidates = [];
		selectedUpdateVersion = '';
		argsToBeFixed = '';
		validationErrors = null;

		if (!task.args_schema || !task.version) {
			return;
		}

		console.log('Checking for new versions');
		const response = await fetch('/api/v1/task');

		if (!response.ok) {
			errorAlert = displayStandardErrorAlert(await response.json(), 'versionUpdateError');
			return;
		}

		/** @type {import('$lib/types').Task[]} */
		const result = await response.json();

		updateCandidates = result.filter((t) => {
			return (
				t.name === task.name &&
				t.owner === task.owner &&
				t.version &&
				t.args_schema &&
				greatestVersionAsc(t, task) === 1
			);
		});
		updateNewVersionsCount(updateCandidates.length);
	}

	function checkArgumentsWithNewSchema() {
		if (errorAlert) {
			errorAlert.hide();
		}
		validationErrors = null;
		argsToBeFixed = '';
		if (!selectedUpdateVersion) {
			return;
		}
		const oldArgs = workflowTask.args || {};
		validateArguments(oldArgs);
	}

	function check() {
		validateArguments(JSON.parse(argsToBeFixed));
	}

	/**
	 * @param args {object}
	 */
	function validateArguments(args) {
		const updateCandidate = updateCandidates.filter((t) => t.version === selectedUpdateVersion)[0];
		const newSchema = updateCandidate.args_schema;
		const validator = new SchemaValidator();
		stripSchemaProperties(newSchema);
		const parsedSchema = JSON.parse(JSON.stringify(newSchema));
		const isSchemaValid = validator.loadSchema(parsedSchema);
		if (!isSchemaValid) {
			errorAlert = displayStandardErrorAlert('Invalid JSON schema', 'versionUpdateError');
			return;
		}
		const valid = validator.isValid(args);
		if (valid) {
			validationErrors = null;
		} else {
			argsToBeFixed = JSON.stringify(args, null, 2);
			validationErrors = validator.getErrors();
		}
	}

	async function update() {
		if (errorAlert) {
			errorAlert.hide();
		}
		if (argsToBeFixed) {
			check();
		}
		if (validationErrors !== null) {
			return;
		}
		let response = await fetch(
			`/api/v1/project/${$page.params.projectId}/workflow/${workflowTask.workflow_id}/wftask/${workflowTask.id}`,
			{
				method: 'DELETE',
				credentials: 'include'
			}
		);

		if (!response.ok) {
			errorAlert = displayStandardErrorAlert(await response.json(), 'versionUpdateError');
			return;
		}

		const newTaskId = updateCandidates.filter((t) => t.version === selectedUpdateVersion)[0].id;
		const newArgs = argsToBeFixed !== '' ? JSON.parse(argsToBeFixed) : workflowTask.args || {};

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		response = await fetch(
			`/api/v1/project/${$page.params.projectId}/workflow/${workflowTask.workflow_id}/wftask?task_id=${newTaskId}`,
			{
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify({
					order: workflowTask.order,
					meta: workflowTask.meta,
					args: newArgs
				})
			}
		);

		const result = await response.json();
		if (!response.ok) {
			errorAlert = displayStandardErrorAlert(result, 'versionUpdateError');
			return;
		}
		updateWorkflowCallback(result);
	}

	$: canBeUpdated =
		selectedUpdateVersion && (validationErrors === null || validationErrors.length === 0);
</script>

<div>
	<div id="versionUpdateError" />
	{#if task.args_schema && task.version}
		{#if updateCandidates.length > 0}
			<label class="form-label" for="updateSelection"> New versions of this task exist: </label>
			<select
				class="form-control"
				bind:value={selectedUpdateVersion}
				id="updateSelection"
				on:change={checkArgumentsWithNewSchema}
			>
				<option value="">Select...</option>
				{#each updateCandidates as update}
					<option>{update.version}</option>
				{/each}
			</select>
			{#if validationErrors}
				<div class="alert alert-danger mt-3">
					<p>Following errors must be fixed before performing the update:</p>
					{#each validationErrors as error}
						<pre>{JSON.stringify(error, null, 2)}</pre>
					{/each}
				</div>
			{/if}
			{#if argsToBeFixed}
				{#if !validationErrors}
					<div class="alert alert-success mt-3">The arguments are valid</div>
				{/if}
				<label class="form-label" for="fix-arguments">Fix the arguments:</label>
				<textarea class="form-control" id="fix-arguments" bind:value={argsToBeFixed} />
				<button type="button" class="btn btn-warning mt-3" on:click={check}> Check </button>
				&nbsp;
			{/if}
			<button type="button" class="btn btn-primary mt-3" on:click={update} disabled={!canBeUpdated}>
				Update
			</button>
		{:else}
			<p>No new versions available</p>
		{/if}
	{:else if !task.version}
		<div class="alert alert-warning">
			It is not possible to check for new versions because task version is not set.
		</div>
	{:else if !task.args_schema}
		<div class="alert alert-warning">
			It is not possible to check for new versions because task has no args_schema.
		</div>
	{/if}
</div>
