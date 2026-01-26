<script>
	import { formatMarkdown } from '$lib/common/component_utilities';
	import { FormErrorHandler } from '$lib/common/errors';
	import { normalizePayload } from 'fractal-components';
	import { tick } from 'svelte';

	/**
	 * @typedef {Object} Props
	 * @property {number} projectId
	 * @property {import("fractal-components/types/api").WorkflowTaskV2} workflowTask
	 * @property {(dataset: import('fractal-components/types/api').WorkflowTaskV2) => void} updateWorkflowTaskCallback
	 */

	/** @type {Props} */
	let { projectId, workflowTask, updateWorkflowTaskCallback } = $props();

	const task = $derived(workflowTask.task);

	const aliasErrorHandler = new FormErrorHandler('errorAlert-alias', ['alias']);
	const aliasValidationErrors = aliasErrorHandler.getValidationErrorStore();

	let aliasInEditing = $state('');
	let editAlias = $state(false);
	let savingAlias = $state(false);

	const descriptionErrorHandler = new FormErrorHandler('errorAlert-description', ['description']);
	const descriptionValidationErrors = descriptionErrorHandler.getValidationErrorStore();

	let descriptionInEditing = $state('');
	let editDescription = $state(false);
	let savingDescription = $state(false);

	async function saveAlias() {
		savingAlias = true;
		aliasErrorHandler.clearErrors();
		const response = await updateWorkflowTask({ alias: aliasInEditing || null });
		if (response.ok) {
			updateWorkflowTaskCallback(await response.json());
			editAlias = false;
		} else {
			await aliasErrorHandler.handleErrorResponse(response);
		}
		savingAlias = false;
	}

	async function showEditAlias() {
		editAlias = true;
		aliasErrorHandler.clearErrors();
		aliasInEditing = workflowTask.alias || '';
		await tick();
		document.getElementById('editAlias')?.focus();
	}

	function undoEditAlias() {
		editAlias = false;
		aliasErrorHandler.clearErrors();
		aliasInEditing = workflowTask.alias || '';
	}

	async function saveDescription() {
		savingDescription = true;
		descriptionErrorHandler.clearErrors();
		const response = await updateWorkflowTask({ description: descriptionInEditing || null });
		if (response.ok) {
			updateWorkflowTaskCallback(await response.json());
			editDescription = false;
		} else {
			await descriptionErrorHandler.handleErrorResponse(response);
		}
		savingDescription = false;
	}

	async function showEditDescription() {
		editDescription = true;
		descriptionErrorHandler.clearErrors();
		descriptionInEditing = workflowTask.description || '';
		await tick();
		document.getElementById('editDescription')?.focus();
	}

	function undoEditDescription() {
		editDescription = false;
		descriptionErrorHandler.clearErrors();
		descriptionInEditing = workflowTask.description || '';
	}

	/**
	 * @param  {object} body
	 */
	async function updateWorkflowTask(body) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/project/${projectId}/workflow/${workflowTask.workflow_id}/wftask/${workflowTask.id}`,
			{
				method: 'PATCH',
				credentials: 'include',
				headers,
				body: normalizePayload(body, { nullifyEmptyStrings: true })
			}
		);
		return response;
	}
</script>

<ul class="list-group">
	<li class="list-group-item list-group-item-light fw-bold">Name</li>
	<li class="list-group-item">{task.name}</li>
	<li class="list-group-item list-group-item-light fw-bold">Alias</li>
	<li class="list-group-item">
		{#if editAlias}
			<div class="input-group has-validation mb-1">
				<input
					type="text"
					id="editAlias"
					aria-label="Workflow task alias"
					bind:value={aliasInEditing}
					class="form-control"
					class:is-invalid={$aliasValidationErrors['alias']}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							saveAlias();
						}
					}}
				/>
				<button
					class="btn btn-outline-secondary"
					type="button"
					onclick={undoEditAlias}
					aria-label="Undo edit alias"
				>
					<i class="bi bi-arrow-counterclockwise"></i>
				</button>
				<button
					class="btn btn-outline-secondary"
					type="button"
					onclick={saveAlias}
					disabled={savingAlias}
				>
					{#if savingAlias}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"> </span>
					{/if}
					Save
				</button>
				<span class="invalid-feedback">{$aliasValidationErrors['alias']}</span>
			</div>
		{:else}
			<span>
				{workflowTask.alias || '–'}
				<button
					class="btn btn-primary float-end pt-0 pb-0"
					onclick={showEditAlias}
					aria-label="Edit workflow task alias"
				>
					<i class="bi bi-pencil"></i>
					Edit
				</button>
			</span>
		{/if}
		<div id="errorAlert-alias"></div>
	</li>
	<li class="list-group-item list-group-item-light fw-bold">Description</li>
	<li class="list-group-item">
		{#if editDescription}
			<div class="input-group has-validation mb-1">
				<input
					type="text"
					id="editDescription"
					aria-label="Workflow task description"
					bind:value={descriptionInEditing}
					class="form-control"
					class:is-invalid={$descriptionValidationErrors['description']}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							saveDescription();
						}
					}}
				/>
				<button
					class="btn btn-outline-secondary"
					type="button"
					onclick={undoEditDescription}
					aria-label="Undo edit description"
				>
					<i class="bi bi-arrow-counterclockwise"></i>
				</button>
				<button
					class="btn btn-outline-secondary"
					type="button"
					onclick={saveDescription}
					disabled={savingDescription}
				>
					{#if savingDescription}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"> </span>
					{/if}
					Save
				</button>
				<span class="invalid-feedback">{$descriptionValidationErrors['description']}</span>
			</div>
		{:else}
			<span>
				{workflowTask.description || '–'}
				<button
					class="btn btn-primary float-end pt-0 pb-0"
					onclick={showEditDescription}
					aria-label="Edit workflow task description"
				>
					<i class="bi bi-pencil"></i>
					Edit
				</button>
			</span>
		{/if}
		<div id="errorAlert-description"></div>
	</li>
	<li class="list-group-item list-group-item-light fw-bold">Version</li>
	<li class="list-group-item">{task.version || '–'}</li>
	<li class="list-group-item list-group-item-light fw-bold">Docs Link</li>
	<li class="list-group-item">
		{#if task.docs_link}
			<a href={task.docs_link} target="_blank">{task.docs_link}</a>
		{:else}
			-
		{/if}
	</li>
	<li class="list-group-item list-group-item-light fw-bold">Docs Info</li>
	<li class="list-group-item">
		{#if task.docs_info}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html formatMarkdown(task.docs_info)}
		{:else}
			-
		{/if}
	</li>
</ul>

<div class="accordion mt-4" id="workflowTaskAdvancedInfo">
	<div class="accordion-item">
		<h2 class="accordion-header">
			<button
				class="accordion-button collapsed"
				type="button"
				data-bs-toggle="collapse"
				data-bs-target="#collapseWorkflowTaskAdvancedInfo"
				aria-expanded="false"
				aria-controls="collapseWorkflowTaskAdvancedInfo"
			>
				Advanced Info
			</button>
		</h2>
		<div
			id="collapseWorkflowTaskAdvancedInfo"
			class="accordion-collapse collapse"
			data-bs-parent="#workflowTaskAdvancedInfo"
		>
			<div class="accordion-body p-0">
				<ul class="list-group">
					<li class="list-group-item list-group-item-light fw-bold">Type</li>
					<li class="list-group-item">{task.type}</li>

					{#if task.command_parallel !== null}
						<li class="list-group-item list-group-item-light fw-bold">Command parallel</li>
						<li class="list-group-item">
							<code>{task.command_parallel}</code>
						</li>
					{/if}

					{#if task.command_non_parallel !== null}
						<li class="list-group-item list-group-item-light fw-bold">Command non parallel</li>
						<li class="list-group-item">
							<code>{task.command_non_parallel}</code>
						</li>
					{/if}

					<li class="list-group-item list-group-item-light fw-bold">Args Schema Version</li>
					<li class="list-group-item">
						{task.args_schema_version || '–'}
					</li>

					{#if task.command_parallel !== null}
						<li class="list-group-item list-group-item-light fw-bold">Args Schema parallel</li>
						<li class="list-group-item">
							{#if task.args_schema_parallel}
								<code>
									<pre>{JSON.stringify(task.args_schema_parallel, null, 2)}</pre>
								</code>
							{:else}
								-
							{/if}
						</li>
					{/if}

					{#if task.command_non_parallel !== null}
						<li class="list-group-item list-group-item-light fw-bold">Args Schema non parallel</li>
						<li class="list-group-item">
							{#if task.args_schema_non_parallel}
								<code>
									<pre>{JSON.stringify(task.args_schema_non_parallel, null, 2)}</pre>
								</code>
							{:else}
								-
							{/if}
						</li>
					{/if}
				</ul>
			</div>
		</div>
	</div>
</div>
