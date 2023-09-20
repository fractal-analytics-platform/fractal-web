<script>
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { enhance } from '$app/forms';
	import { goto, beforeNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import ArgumentForm from '$lib/components/workflow/ArgumentForm.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import MetaPropertiesForm from '$lib/components/workflow/MetaPropertiesForm.svelte';
	import ArgumentsSchema from '$lib/components/workflow/ArgumentsSchema.svelte';
	import WorkflowTaskSelection from '$lib/components/workflow/WorkflowTaskSelection.svelte';
	import { formatMarkdown } from '$lib/common/component_utilities';
	import { displayStandardErrorAlert } from '$lib/common/errors';

	// Workflow
	let workflow = undefined;
	// Project context properties
	let project = undefined;
	let datasets = [];
	// List of available tasks to be inserted into workflow
	let availableTasks = [];

	let workflowTaskContext = writable(undefined);
	let workflowTabContextId = 0;
	let workflowUpdated = false;
	let workflowTaskCreated = false;
	let selectedWorkflowTask = undefined;
	let originalMetaProperties = {};
	let checkingConfiguration = false;
	let inputDatasetControl = '';
	let outputDatasetControl = '';
	let workerInitControl = '';
	let firstTaskIndexControl = '';
	let lastTaskIndexControl = '';
	let argsSchemaAvailable = undefined;
	let argsSchemaValid = undefined;
	let argsChangesSaved = false;
	let argumentsWithUnsavedChanges = false;
	let saveArgumentsChanges = undefined;
	let preventedTaskContextChange = undefined;

	// Update workflow modal
	let updatedWorkflowName = '';
	let updatedWorkflowErrorAlert = undefined;

	$: updatableWorkflowList = workflow?.task_list || [];

	workflowTaskContext.subscribe((value) => {
		selectedWorkflowTask = value;
		originalMetaProperties = {};
		if (value && value.meta) {
			for (let key in value.meta) {
				originalMetaProperties[key] = value.meta[key];
			}
		}
	});

	onMount(async () => {
		workflow = $page.data.workflow;
		project = $page.data.project;
		datasets = $page.data.datasets;
	});

	beforeNavigate((navigation) => {
		if (argumentsWithUnsavedChanges === true) {
			// Prevent navigation
			navigation.cancel();
			// Toggle the modal
			toggleUnsavedChangesModal();
		}
	});

	async function handleExportWorkflow() {
		const response = await fetch(`/projects/${project.id}/workflows/${workflow.id}/export`, {
			method: 'GET',
			credentials: 'include'
		});

		if (!response.ok) {
			console.error(await response.json());
			return;
		}

		const workflowData = await response.json();

		if (workflowData !== null) {
			const file = new File(
				[JSON.stringify(workflowData, '', 2)],
				`workflow-export-${workflow.name}-${Date.now().toString()}.json`,
				{
					type: `application/json`
				}
			);
			const fileUrl = URL.createObjectURL(file);
			const linkElement = document.getElementById('downloadWorkflowButton');
			linkElement.download = `workflow-export-${workflow.name}-${Date.now().toString()}.json`;
			linkElement.href = fileUrl;
			linkElement.click();
		}
	}

	async function getAvailableTasks() {
		// Get available tasks from the server
		const response = await fetch(`/projects/${project.id}/workflows/${workflow.id}/tasks`, {
			method: 'GET',
			credentials: 'include'
		});

		if (response.ok) {
			availableTasks = await response.json();
		} else {
			console.error(response);
			availableTasks = [];
		}
	}

	function resetWorkflowUpdateModal() {
		updatedWorkflowName = workflow.name;
		workflowUpdated = false;
		if (updatedWorkflowErrorAlert) {
			updatedWorkflowErrorAlert.hide();
		}
	}

	/**
	 * Updates a project's workflow in the server
	 * @returns {Promise<void>}
	 */
	async function handleWorkflowUpdate() {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v1/project/${project.id}/workflow/${workflow.id}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				name: updatedWorkflowName
			})
		});

		const result = await response.json();
		if (response.ok) {
			workflow = result;
			workflowUpdated = true;
			setTimeout(() => {
				workflowUpdated = false;
			}, 3000);
		} else {
			console.error('Error updating workflow properties', result);
			updatedWorkflowErrorAlert = displayStandardErrorAlert(result, 'updatedWorkflowError');
		}
	}

	async function handleCreateWorkflowTask({ form }) {
		return async ({ result }) => {
			if (result.type !== 'failure') {
				// Workflow task created
				console.log('Workflow task created');
				// Update workflow
				workflow = result.data;
				// UI Feedback
				workflowTaskCreated = true;
				setTimeout(() => {
					workflowTaskCreated = false;
				}, 3000);
				form.reset();
			} else {
				console.error('Error creating new workflow task', result.data);
			}
		};
	}

	async function handleDeleteWorkflowTask(workflowId, workflowTaskId) {
		const response = await fetch(
			`/projects/${project.id}/workflows/${workflowId}/tasks/${workflowTaskId}`,
			{
				method: 'DELETE',
				credentials: 'include'
			}
		);

		if (response.ok) {
			// Successfully deleted task
			workflow = await response.json();
			workflowTaskContext.set(undefined);
		} else {
			console.error(response);
		}
	}

	async function setActiveWorkflowTaskContext(event) {
		const workflowTaskId = event.currentTarget.getAttribute('data-fs-target');
		const wft = workflow.task_list.find((task) => task.id == workflowTaskId);
		if (argumentsWithUnsavedChanges === true) {
			toggleUnsavedChangesModal();
			preventedTaskContextChange = wft;
			throw new Error('Cannot change workflow task context while there are unsaved changes');
		}
		setWorkflowTaskContext(wft);
	}

	function toggleUnsavedChangesModal() {
		// @ts-ignore
		// eslint-disable-next-line no-undef
		const modal = new bootstrap.Modal(document.getElementById('changes-unsaved-dialog'), {});
		modal.toggle();
	}

	function setWorkflowTaskContext(wft) {
		workflowTaskContext.set(wft);
		// Check if args schema is available
		argsSchemaAvailable =
			wft.task.args_schema === undefined || wft.task.args_schema === null ? false : true;
		// Suppose args schema is valid
		argsSchemaValid = true;
	}

	function moveWorkflowTask(index, direction) {
		const wftList = updatableWorkflowList;

		let replaceId;
		switch (direction) {
			case 'up':
				if (index === 0) break;
				replaceId = index - 1;
				break;
			case 'down':
				if (index === wftList.length - 1) break;
				replaceId = index + 1;
		}

		const replaceTask = wftList[replaceId];
		wftList[replaceId] = wftList[index];
		wftList[index] = replaceTask;
		updatableWorkflowList = wftList;
	}

	/**
	 * Reorders a project's workflow in the server
	 * @returns {Promise<*>}
	 */
	async function handleWorkflowOrderUpdate() {
		const patchData = {
			reordered_workflowtask_ids: updatableWorkflowList.map((t) => t.id)
		};

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v1/project/${project.id}/workflow/${workflow.id}`, {
			method: 'PATCH',
			credentials: 'include',
			mode: 'cors',
			headers,
			body: JSON.stringify(patchData)
		});

		const result = await response.json();
		if (response.ok) {
			console.log('Workflow task order updated');
			workflow = result;
			// @ts-ignore
			// eslint-disable-next-line
			const modal = bootstrap.Modal.getInstance(
				document.getElementById('editWorkflowTasksOrderModal')
			);
			modal.toggle();
		} else {
			console.error('Workflow task order not updated', result);
			displayStandardErrorAlert(result, 'workflowTasksOrderError');
		}
	}

	async function handleApplyWorkflow() {
		if (inputDatasetControl === '') {
			// Preliminary check: if inputDatasetControl is not set, raise an error
			let message = 'Input dataset is required. Select one from the list.';
			console.error(message);
			displayStandardErrorAlert(message, 'applyWorkflowError');
		} else if (outputDatasetControl === '') {
			// Preliminary check: if outputDatasetControl is not set, raise an error
			let message = 'Output dataset is required. Select one from the list.';
			console.error(message);
			displayStandardErrorAlert(message, 'applyWorkflowError');
		} else {
			// Both inputDatasetControl and outputDatasetControl are set, continue

			// Build a FormData object
			const data = new FormData();
			data.append('inputDataset', inputDatasetControl);
			data.append('outputDataset', outputDatasetControl);
			data.append('workerInit', workerInitControl);
			data.append('firstTaskIndex', firstTaskIndexControl);
			data.append('lastTaskIndex', lastTaskIndexControl);

			// Make API call
			const response = await fetch(`/projects/${project.id}/workflows/${workflow.id}/apply`, {
				method: 'POST',
				credentials: 'include',
				body: data
			});

			// Handle API response
			if (response.ok) {
				// Successfully applied workflow
				const job = await response.json();
				// @ts-ignore
				// eslint-disable-next-line
				const modal = bootstrap.Modal.getInstance(document.getElementById('runWorkflowModal'));
				modal.toggle();
				// Navigate to project jobs page
				// Define URL to navigate to
				const jobsUrl = new URL(`/projects/${project.id}/jobs`, window.location.origin);
				// Set jobsUrl search params
				jobsUrl.searchParams.set('workflow', workflow.id);
				jobsUrl.searchParams.set('id', job.id);
				// Trigger navigation
				await goto(jobsUrl);
			} else {
				console.error(response);
				// Set an error message on the component
				displayStandardErrorAlert(await response.json(), 'applyWorkflowError');
			}
		}
	}

	function handleArgsSaved(event) {
		selectedWorkflowTask.args = event.detail.args;
		selectedWorkflowTask = selectedWorkflowTask;
		argsChangesSaved = true;
		setTimeout(() => {
			argsChangesSaved = false;
		}, 3000);
	}

	function resetLastTask() {
		if (lastTaskIndexControl !== '' && firstTaskIndexControl > lastTaskIndexControl) {
			lastTaskIndexControl = '';
		}
	}
</script>

<div class="d-flex justify-content-between align-items-center">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item" aria-current="page">
				<a href="/projects">Projects</a>
			</li>
			{#if $page.params.projectId}
				<li class="breadcrumb-item" aria-current="page">
					<a href="/projects/{$page.params.projectId}">{project?.name}</a>
				</li>
			{/if}
			<li class="breadcrumb-item">Workflows</li>
			{#if workflow}
				<li class="breadcrumb-item active">
					{workflow.name}
				</li>
			{/if}
		</ol>
	</nav>
	<div>
		<a href="/projects/{project?.id}/jobs?workflow={workflow?.id}" class="btn btn-light"
			><i class="bi-journal-code" /> List jobs</a
		>
		<button class="btn btn-light" on:click|preventDefault={handleExportWorkflow}
			><i class="bi-box-arrow-up" /></button
		>
		<a id="downloadWorkflowButton" class="d-none">Download workflow link</a>
		<button
			class="btn btn-light"
			data-bs-toggle="modal"
			data-bs-target="#editWorkflowModal"
			on:click={resetWorkflowUpdateModal}
		>
			<i class="bi-gear-wide-connected" />
		</button>
		<button
			class="btn btn-success"
			on:click|preventDefault={() => {
				if (argumentsWithUnsavedChanges === false) {
					// @ts-ignore
					// eslint-disable-next-line no-undef
					const modal = new bootstrap.Modal(document.getElementById('runWorkflowModal'));
					modal.toggle();
				} else {
					toggleUnsavedChangesModal();
				}
			}}
			><i class="bi-play-fill" /> Run workflow
		</button>
	</div>
</div>

{#if workflow}
	<div class="container py-4 px-0">
		<div class="row">
			<div class="col-4">
				<div class="card">
					<div class="card-header">
						<div class="d-flex justify-content-between align-items-center">
							<span>Workflow sequence</span>
							<div>
								<button
									class="btn btn-light"
									data-bs-toggle="modal"
									data-bs-target="#insertTaskModal"
									on:click={getAvailableTasks}><i class="bi-plus-lg" /></button
								>
								<button
									class="btn btn-light"
									data-bs-toggle="modal"
									data-bs-target="#editWorkflowTasksOrderModal"
									><i class="bi-gear-wide-connected" /></button
								>
							</div>
						</div>
					</div>

					{#if workflow.task_list.length == 0}
						<p class="text-center mt-3">No workflow tasks yet, add one.</p>
					{:else}
						<ul class="list-group list-group-flush">
							{#each workflow.task_list as workflowTask}
								<li
									style="cursor: pointer"
									class="list-group-item list-group-item-action {$workflowTaskContext !==
										undefined && $workflowTaskContext.id == workflowTask.id
										? 'active'
										: ''}"
									data-fs-target={workflowTask.id}
									on:click|preventDefault={setActiveWorkflowTaskContext}
									on:keydown|preventDefault
									on:keyup|preventDefault
									on:keypress|preventDefault
								>
									{workflowTask.task.name} #{workflowTask.id}
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
			<div class="col-8">
				<div class="card">
					<div class="card-header py-1">
						{#if selectedWorkflowTask}
							<div class="d-flex justify-content-between">
								<ul class="nav nav-tabs card-header-tabs">
									<li class="nav-item">
										<button
											data-bs-toggle="tab"
											data-bs-target="#args-tab"
											class="nav-link {workflowTabContextId === 0 ? 'active' : ''}"
											aria-current="true"
											>Arguments
										</button>
									</li>
									<li class="nav-item">
										<button
											data-bs-toggle="tab"
											data-bs-target="#meta-tab"
											class="nav-link {workflowTabContextId === 1 ? 'active' : ''}"
											>Meta
										</button>
									</li>
									<li class="nav-item">
										<button
											data-bs-toggle="tab"
											data-bs-target="#info-tab"
											class="nav-link {workflowTabContextId === 2 ? 'active' : ''}"
											>Info
										</button>
									</li>
								</ul>
								<ConfirmActionButton
									modalId="confirmDeleteWorkflowTask"
									btnStyle="danger"
									buttonIcon="trash"
									message="Delete a workflow task {selectedWorkflowTask.task.name}"
									callbackAction={handleDeleteWorkflowTask.bind(
										this,
										workflow.id,
										selectedWorkflowTask.id
									)}
								/>
							</div>
						{:else}
							Select a workflow task from the list
						{/if}
					</div>
					<div class="tab-content">
						<div id="args-tab" class="tab-pane show active">
							<div class="card-body p-0">
								{#if selectedWorkflowTask}
									{#key selectedWorkflowTask}
										{#if argsSchemaAvailable && argsSchemaValid}
											{#if argsChangesSaved}
												<div class="alert alert-success m-3" role="alert">
													Arguments changes saved successfully
												</div>
											{/if}
											<ArgumentsSchema
												workflowId={workflow.id}
												workflowTaskId={selectedWorkflowTask.id}
												argumentsSchema={selectedWorkflowTask.task.args_schema}
												argumentsSchemaVersion={selectedWorkflowTask.task.args_schema_version}
												args={selectedWorkflowTask.args}
												bind:saveChanges={saveArgumentsChanges}
												bind:validSchema={argsSchemaValid}
												bind:unsavedChanges={argumentsWithUnsavedChanges}
												on:argsSaved={handleArgsSaved}
											/>
										{:else}
											<ArgumentForm
												workflowId={workflow.id}
												workflowTaskId={selectedWorkflowTask.id}
												workflowTaskArgs={selectedWorkflowTask.args}
											/>
										{/if}
									{/key}
								{/if}
							</div>
						</div>
						<div id="meta-tab" class="tab-pane">
							<div class="card-body">
								{#if selectedWorkflowTask}
									{#key selectedWorkflowTask}
										<MetaPropertiesForm
											workflowId={workflow.id}
											taskId={selectedWorkflowTask.id}
											metaProperties={selectedWorkflowTask.meta}
											{originalMetaProperties}
										/>
									{/key}
								{/if}
							</div>
						</div>
						<div id="info-tab" class="tab-pane">
							<div class="card-body">
								{#if selectedWorkflowTask}
									<ul class="list-group">
										<li class="list-group-item list-group-item-light fw-bold">Name</li>
										<li class="list-group-item">{selectedWorkflowTask.task.name}</li>
										<li class="list-group-item list-group-item-light fw-bold">Version</li>
										<li class="list-group-item">{selectedWorkflowTask.task.version || '–'}</li>
										<li class="list-group-item list-group-item-light fw-bold">Docs Link</li>
										<li class="list-group-item">
											{#if selectedWorkflowTask.task.docs_link}
												<a href={selectedWorkflowTask.task.docs_link} target="_blank"
													>{selectedWorkflowTask.task.docs_link}</a
												>
											{:else}
												-
											{/if}
										</li>
										<li class="list-group-item list-group-item-light fw-bold">Docs Info</li>
										<li class="list-group-item">
											{#if selectedWorkflowTask.task.docs_info}
												{@html formatMarkdown(selectedWorkflowTask.task.docs_info)}
											{:else}
												-
											{/if}
										</li>
										<li class="list-group-item list-group-item-light fw-bold">Owner</li>
										<li class="list-group-item">{selectedWorkflowTask.task.owner || '–'}</li>
										<li class="list-group-item list-group-item-light fw-bold">Command</li>
										<li class="list-group-item">
											<code>{selectedWorkflowTask.task.command}</code>
										</li>
										<li class="list-group-item list-group-item-light fw-bold">Source</li>
										<li class="list-group-item"><code>{selectedWorkflowTask.task.source}</code></li>
										<li class="list-group-item list-group-item-light fw-bold">Input Type</li>
										<li class="list-group-item">
											<code>{selectedWorkflowTask.task.input_type}</code>
										</li>
										<li class="list-group-item list-group-item-light fw-bold">Output Type</li>
										<li class="list-group-item">
											<code>{selectedWorkflowTask.task.output_type}</code>
										</li>
										<li class="list-group-item list-group-item-light fw-bold">
											Args Schema Version
										</li>
										<li class="list-group-item">
											{selectedWorkflowTask.task.args_schema_version || '–'}
										</li>
										<li class="list-group-item list-group-item-light fw-bold">Args Schema</li>
										<li class="list-group-item">
											{#if selectedWorkflowTask.task.args_schema}
												<code>
													<pre>{JSON.stringify(
															selectedWorkflowTask.task.args_schema,
															null,
															2
														)}</pre>
												</code>
											{:else}
												-
											{/if}
										</li>
									</ul>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<div class="modal" id="insertTaskModal">
	<div class="modal-dialog modal-dialog-centered">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">New workflow task</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
			</div>
			<div class="modal-body">
				<form method="post" action="?/createWorkflowTask" use:enhance={handleCreateWorkflowTask}>
					<div class="mb-3">
						<WorkflowTaskSelection tasks={availableTasks} />
					</div>

					<div class="mb-3">
						<label for="taskOrder" class="form-label">Task order in workflow</label>
						<input
							id="taskOrder"
							type="number"
							name="taskOrder"
							class="form-control"
							placeholder="Leave it blank to append at the end"
							min="0"
							max={workflow?.task_list.length}
						/>
					</div>

					<button class="btn btn-primary">Insert</button>
				</form>
			</div>
			<div class="modal-footer d-flex">
				{#if workflowTaskCreated}
					<span class="w-100 alert alert-success">Workflow task created</span>
				{/if}
			</div>
		</div>
	</div>
</div>

<div class="modal" id="editWorkflowModal">
	<div class="modal-dialog modal-dialog-centered">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">Workflow properties</h5>
				<button class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
			</div>
			<div class="modal-body">
				<div id="updatedWorkflowError" />
				{#if workflow}
					<form id="updateWorkflow" on:submit|preventDefault={handleWorkflowUpdate}>
						<div class="mb-3">
							<label for="workflowName" class="form-label">Workflow name</label>
							<input
								type="text"
								class="form-control"
								name="workflowName"
								id="workflowName"
								bind:value={updatedWorkflowName}
							/>
						</div>
					</form>
				{/if}
			</div>
			<div class="modal-footer">
				{#if workflowUpdated}
					<span class="alert alert-success">Workflow updated correctly</span>
				{/if}
				<button class="btn btn-primary" form="updateWorkflow">Save</button>
			</div>
		</div>
	</div>
</div>

<div class="modal" id="editWorkflowTasksOrderModal">
	<div class="modal-dialog modal-dialog-centered">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">Edit workflow tasks order</h5>
				<button class="btn-close" data-bs-dismiss="modal" />
			</div>
			<div class="modal-body">
				<div id="workflowTasksOrderError" />
				{#if workflow !== undefined && updatableWorkflowList.length == 0}
					<p class="text-center mt-3">No workflow tasks yet, add one.</p>
				{:else if workflow !== undefined}
					{#key updatableWorkflowList}
						<ul class="list-group list-group-flush">
							{#each updatableWorkflowList as workflowTask, i}
								<li class="list-group-item" data-fs-target={workflowTask.id}>
									<div class="d-flex justify-content-between align-items-center">
										<div>
											{workflowTask.task.name} #{workflowTask.id}
										</div>
										<div>
											{#if i !== 0}
												<button
													class="btn btn-light"
													on:click|preventDefault={moveWorkflowTask.bind(this, i, 'up')}
													><i class="bi-arrow-up" /></button
												>
											{/if}
											{#if i !== updatableWorkflowList.length - 1}
												<button
													class="btn btn-light"
													on:click|preventDefault={moveWorkflowTask.bind(this, i, 'down')}
													><i class="bi-arrow-down" /></button
												>
											{/if}
										</div>
									</div>
								</li>
							{/each}
						</ul>
					{/key}
				{/if}
			</div>
			<div class="modal-footer">
				<button class="btn btn-primary" on:click|preventDefault={handleWorkflowOrderUpdate}
					>Save</button
				>
			</div>
		</div>
	</div>
</div>

<div class="modal" id="runWorkflowModal">
	<div class="modal-dialog modal-dialog-centered">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">Run workflow</h5>
				<button class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
			</div>
			<div class="modal-body">
				<div id="applyWorkflowError" />
				<form id="runWorkflowForm">
					<div class="mb-3">
						<label for="inputDataset" class="form-label">Input dataset</label>
						<select
							name="inputDataset"
							id="inputDataset"
							class="form-control"
							disabled={checkingConfiguration}
							bind:value={inputDatasetControl}
						>
							<option value="">Select an input dataset</option>
							{#each datasets as dataset}
								<option value={dataset.id}>{dataset.name}</option>
							{/each}
						</select>
					</div>
					<div class="mb-3">
						<label for="outputDataset" class="form-label">Output dataset</label>
						<select
							name="outputDataset"
							id="outputDataset"
							class="form-control"
							disabled={checkingConfiguration}
							bind:value={outputDatasetControl}
						>
							<option value="">Select an output dataset</option>
							{#each datasets as dataset}
								<option value={dataset.id}>{dataset.name}</option>
							{/each}
						</select>
					</div>
					<div class="mb-3">
						<label for="firstTaskIndex" class="form-label">First task (Optional)</label>
						<select
							name="firstTaskIndex"
							id="firstTaskIndex"
							class="form-control"
							disabled={checkingConfiguration}
							bind:value={firstTaskIndexControl}
							on:change={resetLastTask}
						>
							<option value="">Select first task</option>
							{#each updatableWorkflowList as wft}
								<option value={wft.order}>{wft.task.name}</option>
							{/each}
						</select>
					</div>
					<div class="mb-3">
						<label for="lastTaskIndex" class="form-label">Last task (Optional)</label>
						<select
							name="lastTaskIndex"
							id="lastTaskIndex"
							class="form-control"
							disabled={checkingConfiguration}
							bind:value={lastTaskIndexControl}
						>
							<option value="">Select last task</option>
							{#each updatableWorkflowList as wft}
								{#if firstTaskIndexControl === '' || wft.order >= firstTaskIndexControl}
									<option value={wft.order}>{wft.task.name}</option>
								{/if}
							{/each}
						</select>
					</div>
					<div class="mb-3">
						<label for="workerInit" class="form-label">Worker initialization (Optional)</label>
						<textarea
							name="workerInit"
							id="workerInit"
							class="form-control font-monospace"
							rows="5"
							disabled={checkingConfiguration}
							bind:value={workerInitControl}
						/>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				{#if checkingConfiguration}
					<button
						class="btn btn-warning"
						on:click={() => {
							checkingConfiguration = false;
						}}>Cancel</button
					>
					<button class="btn btn-primary" on:click|preventDefault={handleApplyWorkflow}
						>Confirm</button
					>
				{:else}
					<button
						class="btn btn-primary"
						on:click={() => {
							checkingConfiguration = true;
						}}>Run</button
					>
				{/if}
			</div>
		</div>
	</div>
</div>

<div class="modal" tabindex="-1" id="changes-unsaved-dialog">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">There are argument changes unsaved</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
			</div>
			<div class="modal-body">
				<p>
					Do you want to save the changes made to the arguments of the current selected workflow
					task?
				</p>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
				<button
					type="button"
					class="btn btn-warning"
					on:click={() => {
						argumentsWithUnsavedChanges = false;
						setWorkflowTaskContext(preventedTaskContextChange);
					}}
					data-bs-dismiss="modal"
					>Discard changes
				</button>
				<button
					type="button"
					class="btn btn-success"
					on:click={saveArgumentsChanges}
					data-bs-dismiss="modal"
					>Save changes
				</button>
			</div>
		</div>
	</div>
</div>
