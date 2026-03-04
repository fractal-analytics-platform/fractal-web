<script>
	import {
		AlertError,
		displayStandardErrorAlert,
		getAlertErrorFromResponse
	} from '$lib/common/errors';
	import { page } from '$app/state';
	import { normalizePayload, SchemaValidator, stripDiscriminator } from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').WorkflowTaskV2} workflowTask
	 * @property {Array<{ task_id: number, version: string }>} updateCandidates
	 * @property {(workflowTask: import('fractal-components/types/api').WorkflowTaskV2) => void} updateWorkflowCallback
	 * @property {import('svelte/store').Writable<number>} newVersionsCount
	 */

	/** @type {Props} */
	let { workflowTask, updateCandidates, updateWorkflowCallback, newVersionsCount } = $props();

	let selectedUpdateVersion = $state('');
	/** @type {import('fractal-components/types/api').TaskV2|undefined} */
	let updateCandidate = $state();
	let dataValid = $state(true);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	function setup() {
		if (errorAlert) {
			errorAlert.hide();
		}
		selectedUpdateVersion = '';
	}

	/**
	 * @param {string} selectedVersion
	 */
	async function loadSelectedTask(selectedVersion) {
		errorAlert?.hide();

		const taskId = updateCandidates.find((u) => u.version === selectedVersion)?.task_id;

		if (taskId === undefined) {
			return;
		}

		const response = await fetch(`/api/v2/task/${taskId}`);
		if (response.ok) {
			updateCandidate = await response.json();
			if (updateCandidate) {
				const nonParallelValid =
					!updateCandidate.args_schema_non_parallel ||
					isDataValid(
						updateCandidate.args_schema_non_parallel,
						updateCandidate.args_schema_version,
						workflowTask.args_non_parallel
					);
				const parallelValid =
					!updateCandidate.args_schema_parallel ||
					isDataValid(
						updateCandidate.args_schema_parallel,
						updateCandidate.args_schema_version,
						workflowTask.args_parallel
					);
				dataValid = nonParallelValid && parallelValid;
			}
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'versionUpdateError'
			);
		}
	}

	/**
	 * @param {any} schema
	 * @param {'pydantic_v1'|'pydantic_v2'} version
	 * @param {any} data
	 */
	function isDataValid(schema, version, data) {
		if (schema) {
			const validator = new SchemaValidator(version, true);
			const isSchemaValid = validator.loadSchema(stripDiscriminator(schema));
			if (!isSchemaValid) {
				errorAlert = displayStandardErrorAlert('Invalid JSON Schema', 'versionUpdateError');
			}
			return validator.isValid(data);
		}
		return true;
	}

	async function update() {
		if (errorAlert) {
			errorAlert.hide();
		}
		try {
			const updatedWorkflowTask = await replaceWorkflowTask();
			updateWorkflowCallback(updatedWorkflowTask);
		} catch (err) {
			if (err instanceof AlertError) {
				errorAlert = displayStandardErrorAlert(err, 'versionUpdateError');
			} else {
				console.error(err);
			}
		}
	}

	async function replaceWorkflowTask() {
		if (!updateCandidate) {
			return;
		}

		const newTaskId = updateCandidate.id;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(
			`/api/v2/project/${page.params.projectId}/workflow/${workflowTask.workflow_id}/wftask/replace-task?workflow_task_id=${workflowTask.id}&task_id=${newTaskId}`,
			{
				method: 'POST',
				credentials: 'include',
				headers,
				body: normalizePayload({
					args_non_parallel: workflowTask.args_non_parallel,
					args_parallel: workflowTask.args_parallel
				})
			}
		);
		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}

		return await response.json();
	}

	/** @type {number|undefined} */
	let previousTaskId = $state();
	const task = $derived(workflowTask.task);

	$effect(() => {
		if (task.id !== previousTaskId) {
			previousTaskId = task.id;
			setup();
		}
	});

	const taskHasArgsSchema = $derived(
		!!(workflowTask.task.args_schema_non_parallel || workflowTask.task.args_schema_parallel)
	);

	$effect(() => {
		loadSelectedTask(selectedUpdateVersion);
	});

	$effect(() => {
		newVersionsCount.set(updateCandidates.length);
	});
</script>

<div>
	<div id="versionUpdateError"></div>
	{#if taskHasArgsSchema && task.version}
		{#if updateCandidates.length > 0}
			<label class="form-label" for="updateSelection">
				New versions of this task exist (current version is {task.version}):
			</label>
			<select class="form-select" bind:value={selectedUpdateVersion} id="updateSelection">
				<option value="">Select...</option>
				{#each updateCandidates as update (update.task_id)}
					<option>{update.version}</option>
				{/each}
			</select>
			{#if selectedUpdateVersion && updateCandidate}
				<div class="alert alert-info mt-3">
					You are updating version from {task.version} to {selectedUpdateVersion}<br />
					{#if updateCandidate.docs_link}
						Information on different version may be found on
						<a href={updateCandidate.docs_link} target="_blank"> task documentation </a>
					{/if}
				</div>
				{#if !dataValid}
					<div class="alert alert-warning mt-3">
						The old arguments are not compatible with the new schema. You can apply the version
						upgrade, and you will then have to review/modify some arguments afterwards.
					</div>
				{/if}
			{/if}
			<button type="button" class="btn btn-primary mt-2" onclick={update}> Update </button>
		{:else}
			<p>No new versions available</p>
		{/if}
	{:else if !taskHasArgsSchema}
		<div class="alert alert-warning">
			It is not possible to check for new versions because task has no args_schema.
		</div>
	{:else if !task.version}
		<div class="alert alert-warning">
			It is not possible to check for new versions because task version is not set.
		</div>
	{/if}
</div>
