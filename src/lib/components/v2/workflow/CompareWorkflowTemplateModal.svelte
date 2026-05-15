<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import { onMount } from 'svelte';
	import JsonDiffViewer from './JsonDiffViewer.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').WorkflowV2} workflow
	 */

	/** @type {Props} */
	let { workflow } = $props();

	/** @type {Modal|undefined} */
	let modal = $state();
	let loading = $state(false);

	/** @type {Array<{match: boolean, argsMatch: boolean, title: string, templateTask: import('fractal-components/types/api').WorkflowTaskExport|undefined, workflowTask: import('fractal-components/types/api').WorkflowTaskExport|undefined}>} */
	let comparison = $state([]);

	export async function show() {
		modal?.show();
	}

	export async function loadTemplate() {
		try {
			loading = true;
			const templateTaskList = await loadTemplateTaskList();
			const workflowTaskList = await loadWorkflowTaskList();
			comparison = [
				...new Array(Math.max(templateTaskList.length, workflowTaskList.length)).keys()
			].map((i) => {
				const templateTask = templateTaskList[i];
				const workflowTask = workflowTaskList[i];
				return compare(templateTask, workflowTask);
			});
		} catch (err) {
			modal?.displayErrorAlert(err);
		} finally {
			loading = false;
		}
	}

	/**
	 * @returns {Promise<Array<import('fractal-components/types/api').WorkflowTaskExport>>}
	 */
	async function loadTemplateTaskList() {
		const response = await fetch(`/api/v2/workflow-template/${workflow.template_id}`);
		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}
		const { data } = await response.json();
		return data.task_list;
	}

	/**
	 * @returns {Promise<Array<import('fractal-components/types/api').WorkflowTaskExport>>}
	 */
	async function loadWorkflowTaskList() {
		const response = await fetch(
			`/api/v2/project/${workflow.project_id}/workflow/${workflow.id}/export`
		);
		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}
		const { task_list } = await response.json();
		return task_list;
	}

	/**
	 * @param {import('fractal-components/types/api').WorkflowTaskExport|undefined} templateTask
	 * @param {import('fractal-components/types/api').WorkflowTaskExport|undefined} workflowTask
	 */
	function compare(templateTask, workflowTask) {
		const match =
			!!templateTask &&
			!!workflowTask &&
			templateTask.task.pkg_name === workflowTask.task.pkg_name &&
			templateTask.task.version === workflowTask.task.version &&
			templateTask.task.name === workflowTask.task.name;
		const argsMatch =
			!!templateTask &&
			!!workflowTask &&
			compareArgs(templateTask.args_non_parallel, workflowTask.args_non_parallel) &&
			compareArgs(templateTask.args_parallel, workflowTask.args_parallel);
		const title = match
			? templateTask.task.name
			: templateTask
				? templateTask && workflowTask && templateTask.task.name !== workflowTask.task.name
					? `${templateTask.task.name} / ${workflowTask.task.name}`
					: templateTask.task.name
				: workflowTask?.task.name || '';
		return {
			match,
			argsMatch,
			title,
			templateTask,
			workflowTask
		};
	}

	/**
	 * @param {object|null} a1
	 * @param {object|null} a2
	 */
	function compareArgs(a1, a2) {
		// treat in the same way null and empty object
		if (
			(a1 === null && a2 === null) ||
			(a1 === null && Object.keys(a2).length === 0) ||
			(a2 === null && Object.keys(a1).length === 0)
		) {
			return true;
		}
		return JSON.stringify(a1) === JSON.stringify(a2);
	}

	/**
	 * @param {object | null} value
	 */
	function hasArguments(value) {
		return value !== null && Object.keys(value).length > 0;
	}

	// onMount(async () => {
	//     await import('json-diff-viewer-component');
	// });
</script>

<Modal id="compare-workflow-template" fullscreen={true} onOpen={loadTemplate} bind:this={modal}>
	{#snippet header()}
		<h5 class="modal-title">Compare workflow to template</h5>
	{/snippet}
	{#snippet body()}
		<div id="errorAlert-compare-workflow-template"></div>
		{#if loading}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
		{:else}
			<div class="accordion" id="accordion-compare-workflow-template">
				{#key comparison}
					{#each comparison as diff, index (index)}
						<div class="accordion-item">
							<h2 class="accordion-header">
								<button
									class="accordion-button collapsed"
									type="button"
									data-bs-toggle="collapse"
									data-bs-target="#collapse-{index}"
									aria-expanded="false"
									aria-controls="collapse-{index}"
								>
									{#if diff.match}
										{#if diff.argsMatch}
											<span class="text-success">
												<i class="bi bi-check-circle-fill"></i>
											</span>
										{:else}
											<span class="text-warning">
												<i class="bi bi-exclamation-circle-fill"></i>
											</span>
										{/if}
									{:else}
										<span class="text-danger">
											<i class="bi bi-x-circle-fill"></i>
										</span>
									{/if}
									<span class="ms-3">{diff.title}</span>
								</button>
							</h2>
							<div
								id="collapse-{index}"
								class="accordion-collapse collapse"
								data-bs-parent="#accordion-compare-workflow-template"
							>
								<div class="accordion-body">
									{#if diff.match && diff.templateTask && diff.workflowTask}
										<p>
											<strong>Matching task</strong> ({diff.templateTask.task.pkg_name},
											{diff.templateTask.task.version}, {diff.templateTask.task.name})
										</p>
										{#if hasArguments(diff.templateTask.args_non_parallel) && compareArgs(diff.templateTask.args_non_parallel, diff.workflowTask.args_non_parallel)}
											<p><em>Non-parallel arguments match.</em></p>
										{/if}
										{#if hasArguments(diff.templateTask.args_parallel) && compareArgs(diff.templateTask.args_parallel, diff.workflowTask.args_parallel)}
											<p><em>Parallel arguments match.</em></p>
										{/if}
										{#if !diff.argsMatch}
											{#if !compareArgs(diff.templateTask.args_non_parallel, diff.workflowTask.args_non_parallel)}
												<h5>Non-parallel arguments</h5>
												<JsonDiffViewer
													id={`non-parallel-${index}`}
													left={diff.templateTask.args_non_parallel}
													right={diff.workflowTask.args_non_parallel}
												/>
											{/if}
											{#if !compareArgs(diff.templateTask.args_parallel, diff.workflowTask.args_parallel)}
												<h5 class="mt-2">Parallel arguments</h5>
												<JsonDiffViewer
													id={`parallel-${index}`}
													left={diff.templateTask.args_parallel}
													right={diff.workflowTask.args_parallel}
												/>
											{/if}
										{/if}
									{:else}
										<p>
											<strong>Template</strong>:
											{#if diff.templateTask}
												<span
													class:text-danger={diff.workflowTask &&
														diff.templateTask.task.pkg_name !== diff.workflowTask.task.pkg_name}
												>
													{diff.templateTask.task.pkg_name}
												</span>,
												<span
													class:text-danger={diff.workflowTask &&
														diff.templateTask.task.version !== diff.workflowTask.task.version}
												>
													{diff.templateTask.task.version}
												</span>,
												<span
													class:text-danger={diff.workflowTask &&
														diff.templateTask.task.name !== diff.workflowTask.task.name}
												>
													{diff.templateTask.task.name}
												</span>
											{:else}
												<span class="text-danger">not defined</span>
											{/if}
										</p>
										<p>
											<strong>Workflow</strong>:
											{#if diff.workflowTask}
												<span
													class:text-danger={diff.templateTask &&
														diff.templateTask.task.pkg_name !== diff.workflowTask.task.pkg_name}
												>
													{diff.workflowTask.task.pkg_name}
												</span>,
												<span
													class:text-danger={diff.templateTask &&
														diff.templateTask.task.version !== diff.workflowTask.task.version}
												>
													{diff.workflowTask.task.version}
												</span>,
												<span
													class:text-danger={diff.templateTask &&
														diff.templateTask.task.name !== diff.workflowTask.task.name}
												>
													{diff.workflowTask.task.name}
												</span>
											{:else}
												<span class="text-danger">not defined</span>
											{/if}
										</p>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				{/key}
			</div>
		{/if}
	{/snippet}
</Modal>
