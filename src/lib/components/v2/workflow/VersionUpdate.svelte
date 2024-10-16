<script>
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import { page } from '$app/stores';
	import VersionUpdateFixArgs from './VersionUpdateFixArgs.svelte';
	import { tick } from 'svelte';
	import { getNewVersions } from './version-checker';

	/** @type {import('$lib/types-v2').WorkflowTaskV2} */
	export let workflowTask;

	/** @type {(workflowTask: import('$lib/types-v2').WorkflowTaskV2) => void} */
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

	/** @type {import('$lib/types-v2').TaskV2[]} */
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
		if (!taskHasArgsSchema || !task.version) {
			return;
		}

		try {
			updateCandidates = await getNewVersions(workflowTask.task);
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
		let response = await fetch(
			`/api/v2/project/${$page.params.projectId}/workflow/${workflowTask.workflow_id}/wftask/${workflowTask.id}`,
			{
				method: 'DELETE',
				credentials: 'include'
			}
		);

		if (!response.ok) {
			const result = await response.json();
			errorAlert = displayStandardErrorAlert(
				new AlertError(result, response.status),
				'versionUpdateError'
			);
			return;
		}

		const newTaskId = updateCandidates.filter((t) => t.version === selectedUpdateVersion)[0].id;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		response = await fetch(
			`/api/v2/project/${$page.params.projectId}/workflow/${workflowTask.workflow_id}/wftask?task_id=${newTaskId}`,
			{
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify({
					meta_non_parallel: workflowTask.meta_non_parallel,
					meta_parallel: workflowTask.meta_parallel,
					input_filters: workflowTask.input_filters,
					args_non_parallel:
						fixArgsComponentNonParallel?.getNewArgs() || workflowTask.args_non_parallel,
					args_parallel: fixArgsComponentParallel?.getNewArgs() || workflowTask.args_parallel
				})
			}
		);

		const result = await response.json();
		if (!response.ok) {
			errorAlert = displayStandardErrorAlert(
				new AlertError(result, response.status),
				'versionUpdateError'
			);
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
</script>

<div>
	<div id="versionUpdateError" />
	{#if taskHasArgsSchema && task.version}
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
	{:else if !task.version}
		<div class="alert alert-warning">
			It is not possible to check for new versions because task version is not set.
		</div>
	{:else if !taskHasArgsSchema}
		<div class="alert alert-warning">
			It is not possible to check for new versions because task has no args_schema.
		</div>
	{/if}
</div>
