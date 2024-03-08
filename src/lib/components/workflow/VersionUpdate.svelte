<script>
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import { SchemaValidator } from '$lib/common/jschema_validation';
	import { page } from '$app/stores';
	import { stripSchemaProperties } from '../common/jschema/schema_management';
	import { getNewVersions } from './version-checker';

	/** @type {import('$lib/types').WorkflowTask} */
	export let workflowTask;

	/** @type {(workflowTask: import('$lib/types').WorkflowTask) => void} */
	export let updateWorkflowCallback;
	/** @type {(count: number) => Promise<void>} */
	export let updateNewVersionsCount;

	$: task = workflowTask.task;

	/** @type {import('$lib/types').Task[]} */
	let updateCandidates = [];
	let selectedUpdateVersion = '';
	let originalArgs = '';
	let argsToBeFixed = '';
	let argsToBeFixedValidJson = true;
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

		try {
			updateCandidates = await getNewVersions(task, $page.data.apiVersion);
		} catch (error) {
			errorAlert = displayStandardErrorAlert(error, 'versionUpdateError');
			return;
		}

		await updateNewVersionsCount(updateCandidates.length);
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
		originalArgs = JSON.stringify(oldArgs, null, 2);
		validateArguments(oldArgs);
	}

	function check() {
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

	function cancel() {
		argsToBeFixed = originalArgs;
		check();
	}

	/**
	 * @param args {object}
	 */
	function validateArguments(args) {
		const updateCandidate = updateCandidates.filter((t) => t.version === selectedUpdateVersion)[0];
		const newSchema =
			/** @type {import('../common/jschema/jschema-types').JSONSchemaObjectProperty} */ (
				updateCandidate.args_schema
			);
		const validator = new SchemaValidator(true);
		if ('properties' in newSchema) {
			stripSchemaProperties(newSchema);
		}
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
		if (!argsToBeFixedValidJson || validationErrors !== null) {
			return;
		}
		let response = await fetch(
			`/api/${$page.data.apiVersion}/project/${$page.params.projectId}/workflow/${workflowTask.workflow_id}/wftask/${workflowTask.id}`,
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
			`/api/${$page.data.apiVersion}/project/${$page.params.projectId}/workflow/${workflowTask.workflow_id}/wftask?task_id=${newTaskId}`,
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

	function getSelectedUpdateCandidate() {
		const selectedCandidate = updateCandidates.filter((t) => t.version === selectedUpdateVersion);
		if (selectedCandidate.length === 1) {
			return selectedCandidate[0];
		}
		return null;
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
			{#if selectedUpdateVersion}
				<div class="alert alert-warning mt-3">
					You are updating version from {task.version} to {selectedUpdateVersion}<br />
					{#if getSelectedUpdateCandidate()?.docs_link}
						Information on different version may be found on
						<a href={getSelectedUpdateCandidate()?.docs_link} target="_blank">
							task documentation
						</a>
					{/if}
				</div>
			{/if}
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
			{#if argsToBeFixed}
				{#if !validationErrors}
					<div class="alert alert-success mt-3">The arguments are valid</div>
				{/if}
				<label class="form-label" for="fix-arguments">Fix the arguments:</label>
				<textarea
					class="form-control"
					id="fix-arguments"
					class:is-invalid={!argsToBeFixedValidJson}
					bind:value={argsToBeFixed}
					rows="20"
				/>
				{#if !argsToBeFixedValidJson}
					<div class="invalid-feedback">Invalid JSON</div>
				{/if}
				<button type="button" class="btn btn-warning mt-3" on:click={check}> Check </button>
				&nbsp;
				<button
					type="button"
					class="btn btn-secondary mt-3"
					on:click={cancel}
					disabled={argsToBeFixed === originalArgs}
				>
					Cancel
				</button>
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
