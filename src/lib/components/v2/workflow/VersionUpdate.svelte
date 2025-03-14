<script>
	import {
		AlertError,
		displayStandardErrorAlert,
		getAlertErrorFromResponse
	} from '$lib/common/errors';
	import { page } from '$app/stores';
	import VersionUpdateFixArgs from './VersionUpdateFixArgs.svelte';
	import { tick } from 'svelte';
	import { getNewVersions } from './version-checker';

	/** @type {import('fractal-components/types/api').WorkflowTaskV2} */
	export let workflowTask;

	/** @type {(workflowTask: import('fractal-components/types/api').WorkflowTaskV2) => void} */
	export let updateWorkflowCallback;
	/** @type {(count: number) => Promise<void>} */
	export let updateNewVersionsCount;

	/** @type {VersionUpdateFixArgs|undefined} */
	let fixArgsComponentNonParallel;
	/** @type {VersionUpdateFixArgs|undefined} */
	let fixArgsComponentParallel;

	let nonParallelCanBeUpdated = false;
	let parallelCanBeUpdated = false;

	let nonParallelArgsChanged = false;
	let parallelArgsChanged = false;

	let displayCheckAndCancelBtn = true;

	$: task = workflowTask.task;
	let taskVersion = '';

	/** @type {Array<import('fractal-components/types/api').TaskV2 & { version: string }>} */
	let updateCandidates = [];
	let selectedUpdateVersion = '';

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	$: {
		if (task) {
			checkNewVersions();
		}
	}

	$: updateCandidate =
		selectedUpdateVersion === ''
			? null
			: updateCandidates.filter((t) => t.version === selectedUpdateVersion)[0];

	$: cancelEnabled = nonParallelArgsChanged || parallelArgsChanged;

	$: taskHasArgsSchema = !!(
		workflowTask.task.args_schema_non_parallel || workflowTask.task.args_schema_parallel
	);

	$: updateCandidateType =
		updateCandidate && 'type' in updateCandidate ? updateCandidate.type : 'parallel';

	$: canBeUpdated =
		selectedUpdateVersion &&
		updateCandidate &&
		(((updateCandidateType === 'non_parallel' || updateCandidateType === 'compound') &&
			nonParallelCanBeUpdated) ||
			((updateCandidateType === 'parallel' || updateCandidateType === 'compound') &&
				parallelCanBeUpdated));

	async function checkNewVersions() {
		if (errorAlert) {
			errorAlert.hide();
		}
		updateCandidates = [];
		selectedUpdateVersion = '';
		fixArgsComponentNonParallel?.reset();
		fixArgsComponentParallel?.reset();

		await tick(); // wait taskHasArgsSchema is set
		if (!taskHasArgsSchema) {
			return;
		}

		try {
			const newVersionsResult = await getNewVersions(workflowTask.task);
			updateCandidates = newVersionsResult.updateCandidates;
			taskVersion = newVersionsResult.enrichedTask.version || '';
		} catch (error) {
			errorAlert = displayStandardErrorAlert(error, 'versionUpdateError');
			return;
		}

		await updateNewVersionsCount(updateCandidates.length);
	}

	async function checkArgumentsWithNewSchema() {
		if (errorAlert) {
			errorAlert.hide();
		}
		fixArgsComponentNonParallel?.reset();
		fixArgsComponentParallel?.reset();
		if (!selectedUpdateVersion) {
			return;
		}
		// await components rendering
		await tick();
		const displayTextareaNonParallel =
			fixArgsComponentNonParallel?.checkArgumentsWithNewSchema() || false;
		const displayTextareaParallel =
			fixArgsComponentParallel?.checkArgumentsWithNewSchema() || false;
		displayCheckAndCancelBtn = displayTextareaNonParallel || displayTextareaParallel;
	}

	function check() {
		fixArgsComponentNonParallel?.check();
		fixArgsComponentParallel?.check();
	}

	function cancel() {
		fixArgsComponentNonParallel?.cancel();
		fixArgsComponentParallel?.cancel();
	}

	async function update() {
		if (errorAlert) {
			errorAlert.hide();
		}
		try {
			fixArgsComponentNonParallel?.check();
			fixArgsComponentParallel?.check();
		} catch (err) {
			errorAlert = displayStandardErrorAlert(err, 'versionUpdateError');
			return;
		}
		if (
			fixArgsComponentNonParallel?.hasValidationErrors() ||
			fixArgsComponentParallel?.hasValidationErrors()
		) {
			return;
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
		const newTaskId = updateCandidates.filter((t) => t.version === selectedUpdateVersion)[0].id;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(
			`/api/v2/project/${$page.params.projectId}/workflow/${workflowTask.workflow_id}/wftask/replace-task?workflow_task_id=${workflowTask.id}&task_id=${newTaskId}`,
			{
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify({
					args_non_parallel:
						fixArgsComponentNonParallel?.getNewArgs() || workflowTask.args_non_parallel,
					args_parallel: fixArgsComponentParallel?.getNewArgs() || workflowTask.args_parallel
				})
			}
		);
		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}

		return await response.json();
	}

	function getSelectedUpdateCandidate() {
		const selectedCandidate = updateCandidates.filter((t) => t.version === selectedUpdateVersion);
		if (selectedCandidate.length === 1) {
			return selectedCandidate[0];
		}
		return null;
	}
</script>

<div>
	<div id="versionUpdateError" />
	{#if taskHasArgsSchema && taskVersion}
		{#if updateCandidates.length > 0}
			<label class="form-label" for="updateSelection">
				New versions of this task exist (current version is {taskVersion}):
			</label>
			<select
				class="form-select"
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
					You are updating version from {taskVersion} to {selectedUpdateVersion}<br />
					{#if getSelectedUpdateCandidate()?.docs_link}
						Information on different version may be found on
						<a href={getSelectedUpdateCandidate()?.docs_link} target="_blank">
							task documentation
						</a>
					{/if}
				</div>
			{/if}
			{#if updateCandidate}
				{#if updateCandidateType === 'non_parallel' || updateCandidateType === 'compound'}
					<VersionUpdateFixArgs
						{workflowTask}
						{updateCandidate}
						parallel={false}
						bind:canBeUpdated={nonParallelCanBeUpdated}
						bind:argsChanged={nonParallelArgsChanged}
						bind:this={fixArgsComponentNonParallel}
					/>
				{/if}
				{#if updateCandidateType === 'parallel' || updateCandidateType === 'compound'}
					<VersionUpdateFixArgs
						{workflowTask}
						{updateCandidate}
						parallel={true}
						bind:canBeUpdated={parallelCanBeUpdated}
						bind:argsChanged={parallelArgsChanged}
						bind:this={fixArgsComponentParallel}
					/>
				{/if}
			{/if}
			{#if updateCandidate}
				{#if displayCheckAndCancelBtn}
					<button type="button" class="btn btn-warning mt-3" on:click={check}> Check </button>
					&nbsp;
					<button
						type="button"
						class="btn btn-secondary mt-3"
						on:click={cancel}
						disabled={!cancelEnabled}
					>
						Cancel
					</button>
					&nbsp;
				{/if}
			{/if}
			<button type="button" class="btn btn-primary mt-3" on:click={update} disabled={!canBeUpdated}>
				Update
			</button>
		{:else}
			<p>No new versions available</p>
		{/if}
	{:else if !taskHasArgsSchema}
		<div class="alert alert-warning">
			It is not possible to check for new versions because task has no args_schema.
		</div>
	{:else if !taskVersion}
		<div class="alert alert-warning">
			It is not possible to check for new versions because task version is not set.
		</div>
	{/if}
</div>
