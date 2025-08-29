<script>
	import {
		AlertError,
		displayStandardErrorAlert,
		getAlertErrorFromResponse
	} from '$lib/common/errors';
	import { page } from '$app/state';
	import VersionUpdateFixArgs from './VersionUpdateFixArgs.svelte';
	import { tick } from 'svelte';
	import {
		isCompoundType,
		isNonParallelType,
		isParallelType,
		normalizePayload
	} from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').WorkflowTaskV2} workflowTask
	 * @property {Array<{ task_id: number, version: string }>} updateCandidates
	 * @property {(workflowTask: import('fractal-components/types/api').WorkflowTaskV2) => void} updateWorkflowCallback
	 * @property {import('svelte/store').Writable<number>} newVersionsCount
	 */

	/** @type {Props} */
	let { workflowTask, updateCandidates, updateWorkflowCallback, newVersionsCount } = $props();

	/** @type {VersionUpdateFixArgs|undefined} */
	let fixArgsComponentNonParallel = $state();
	/** @type {VersionUpdateFixArgs|undefined} */
	let fixArgsComponentParallel = $state();

	let nonParallelCanBeUpdated = $state(false);
	let parallelCanBeUpdated = $state(false);

	let nonParallelArgsChanged = $state(false);
	let parallelArgsChanged = $state(false);

	let displayCheckAndCancelBtn = $state(true);

	let selectedUpdateVersion = $state('');
	/** @type {import('fractal-components/types/api').TaskV2|undefined} */
	let updateCandidate = $state();

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	function setup() {
		if (errorAlert) {
			errorAlert.hide();
		}
		selectedUpdateVersion = '';
		fixArgsComponentNonParallel?.reset();
		fixArgsComponentParallel?.reset();
	}

	/**
	 * @param {string} selectedVersion
	 */
	async function loadSelectedTask(selectedVersion) {
		const taskId = updateCandidates.find((u) => u.version === selectedVersion)?.task_id;

		if (taskId === undefined) {
			return;
		}

		const response = await fetch(`/api/v2/task/${taskId}`);
		if (response.ok) {
			updateCandidate = await response.json();
			await checkArgumentsWithNewSchema();
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'versionUpdateError'
			);
		}
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

	/** @type {number|undefined} */
	let previousTaskId = $state();
	const task = $derived(workflowTask.task);

	$effect(() => {
		if (task.id !== previousTaskId) {
			previousTaskId = task.id;
			setup();
		}
	});

	const cancelEnabled = $derived(nonParallelArgsChanged || parallelArgsChanged);
	const taskHasArgsSchema = $derived(
		!!(workflowTask.task.args_schema_non_parallel || workflowTask.task.args_schema_parallel)
	);
	const updateCandidateType = $derived(
		updateCandidate && 'type' in updateCandidate ? updateCandidate.type : 'parallel'
	);
	const canBeUpdated = $derived(
		selectedUpdateVersion &&
			updateCandidate &&
			(((isNonParallelType(updateCandidateType) || isCompoundType(updateCandidateType)) &&
				nonParallelCanBeUpdated) ||
				((isParallelType(updateCandidateType) || isCompoundType(updateCandidateType)) &&
					parallelCanBeUpdated))
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
				<div class="alert alert-warning mt-3">
					You are updating version from {task.version} to {selectedUpdateVersion}<br />
					{#if updateCandidate.docs_link}
						Information on different version may be found on
						<a href={updateCandidate.docs_link} target="_blank"> task documentation </a>
					{/if}
				</div>
				{#if isNonParallelType(updateCandidateType) || isCompoundType(updateCandidateType)}
					<VersionUpdateFixArgs
						{workflowTask}
						{updateCandidate}
						parallel={false}
						bind:canBeUpdated={nonParallelCanBeUpdated}
						bind:argsChanged={nonParallelArgsChanged}
						bind:this={fixArgsComponentNonParallel}
					/>
				{/if}
				{#if isParallelType(updateCandidateType) || isCompoundType(updateCandidateType)}
					<VersionUpdateFixArgs
						{workflowTask}
						{updateCandidate}
						parallel={true}
						bind:canBeUpdated={parallelCanBeUpdated}
						bind:argsChanged={parallelArgsChanged}
						bind:this={fixArgsComponentParallel}
					/>
				{/if}
				{#if displayCheckAndCancelBtn}
					<button type="button" class="btn btn-warning mt-3" onclick={check}> Check </button>
					&nbsp;
					<button
						type="button"
						class="btn btn-secondary mt-3"
						onclick={cancel}
						disabled={!cancelEnabled}
					>
						Cancel
					</button>
					&nbsp;
				{/if}
			{/if}
			<button type="button" class="btn btn-primary mt-3" onclick={update} disabled={!canBeUpdated}>
				Update
			</button>
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
