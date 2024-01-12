<script>
	import { onDestroy, onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { goto, beforeNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import ArgumentForm from '$lib/components/workflow/ArgumentForm.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import MetaPropertiesForm from '$lib/components/workflow/MetaPropertiesForm.svelte';
	import ArgumentsSchema from '$lib/components/workflow/ArgumentsSchema.svelte';
	import WorkflowTaskSelection from '$lib/components/workflow/WorkflowTaskSelection.svelte';
	import { formatMarkdown, replaceEmptyStrings } from '$lib/common/component_utilities';
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import VersionUpdate from '$lib/components/workflow/VersionUpdate.svelte';
	import { getAllNewVersions } from '$lib/components/workflow/version-checker';

	// Workflow
	/** @type {import('$lib/types').Workflow|undefined} */
	let workflow = undefined;
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let workflowErrorAlert = undefined;
	// Project context properties
	let project = undefined;
	let datasets = [];
	// List of available tasks to be inserted into workflow
	let availableTasks = [];

	/** @type {import('svelte/types/runtime/store').Writable<import('$lib/types').WorkflowTask|undefined>} */
	let workflowTaskContext = writable(undefined);
	let workflowTabContextId = 0;
	let workflowSuccessMessage = '';
	/** @type {import('$lib/types').WorkflowTask|undefined} */
	let selectedWorkflowTask = undefined;
	let originalMetaProperties = {};
	let checkingConfiguration = false;
	let inputDatasetControl = '';
	let outputDatasetControl = '';
	let setSlurmAccount = true;
	let slurmAccount =
		$page.data.userInfo.slurm_accounts.length === 0 ? '' : $page.data.userInfo.slurm_accounts[0];
	let workerInitControl = '';
	let firstTaskIndexControl = '';
	let lastTaskIndexControl = '';
	let argsSchemaAvailable = undefined;
	let argsSchemaValid = undefined;
	let argsChangesSaved = false;
	let argumentsWithUnsavedChanges = false;
	let saveArgumentsChanges = undefined;
	let preventedTaskContextChange = undefined;

	// Create workflow task modal
	/** @type {number|undefined} */
	let taskOrder = undefined;
	let workflowTaskSelectionComponent = undefined;

	// Update workflow modal
	let updatedWorkflowName = '';

	// Modals
	/** @type {Modal} */
	let unsavedChangesModal;
	/** @type {Modal} */
	let runWorkflowModal;
	/** @type {Modal} */
	let editWorkflowTasksOrderModal;
	/** @type {Modal} */
	let insertTaskModal;
	/** @type {Modal} */
	let editWorkflowModal;

	/** @type {{ [id: string]: import('$lib/types').Task[] }} */
	let newVersionsMap = {};

	$: updatableWorkflowList = workflow?.task_list || [];

	const unsubscribe = workflowTaskContext.subscribe((value) => {
		selectedWorkflowTask = value;
		originalMetaProperties = {};
		if (value && value.meta) {
			for (let key in value.meta) {
				originalMetaProperties[key] = value.meta[key];
			}
		}
	});

	onMount(async () => {
		workflow = /** @type {import('$lib/types').Workflow} */ ($page.data.workflow);
		project = workflow.project;
		datasets = $page.data.datasets;
		checkNewVersions();
	});

	beforeNavigate((navigation) => {
		if (argumentsWithUnsavedChanges === true) {
			// Prevent navigation
			navigation.cancel();
			// Toggle the modal
			toggleUnsavedChangesModal();
		}
	});

	/**
	 * Exports a project's workflow from the server
	 * @returns {Promise<void>}
	 */
	async function handleExportWorkflow() {
		if (!workflow) {
			return;
		}

		const response = await fetch(`/api/v1/project/${project.id}/workflow/${workflow.id}/export`, {
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
				[JSON.stringify(workflowData, null, 2)],
				`workflow-export-${workflow.name}-${Date.now().toString()}.json`,
				{
					type: `application/json`
				}
			);
			const fileUrl = URL.createObjectURL(file);
			const linkElement = /** @type {HTMLAnchorElement} */ (
				document.getElementById('downloadWorkflowButton')
			);
			linkElement.download = `workflow-export-${workflow.name}-${Date.now().toString()}.json`;
			linkElement.href = fileUrl;
			linkElement.click();
		}
	}

	async function getAvailableTasks() {
		resetCreateWorkflowTaskModal();

		// Get available tasks from the server
		const response = await fetch('/api/v1/task', {
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
		if (!workflow) {
			return;
		}
		updatedWorkflowName = workflow.name;
	}

	let workflowUpdating = false;

	/**
	 * Updates a project's workflow in the server
	 * @returns {Promise<void>}
	 */
	async function handleWorkflowUpdate() {
		workflowUpdating = true;
		editWorkflowModal.confirmAndHide(
			async () => {
				workflowSuccessMessage = '';
				if (!workflow) {
					return;
				}

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
					workflowSuccessMessage = 'Workflow updated correctly';
				} else {
					console.error('Error updating workflow properties', result);
					throw new AlertError(result);
				}
			},
			() => {
				workflowUpdating = false;
			}
		);
	}

	function resetCreateWorkflowTaskModal() {
		taskOrder = undefined;
		insertTaskModal.hideErrorAlert();
		workflowTaskSelectionComponent.reset();
	}

	let creatingWorkflowTask = false;

	/**
	 * Creates a new project's workflow task in the server.
	 * @returns {Promise<void>}
	 */
	async function handleCreateWorkflowTask() {
		insertTaskModal.confirmAndHide(
			async () => {
				if (!workflow) {
					return;
				}
				workflowSuccessMessage = '';
				creatingWorkflowTask = true;

				const taskId = workflowTaskSelectionComponent.getSelectedTaskId();
				if (taskId === undefined) {
					return;
				}

				const headers = new Headers();
				headers.set('Content-Type', 'application/json');

				// Creating workflow task
				const workflowTaskResponse = await fetch(
					`/api/v1/project/${project.id}/workflow/${workflow.id}/wftask?task_id=${taskId}`,
					{
						method: 'POST',
						credentials: 'include',
						headers,
						body: JSON.stringify({
							order: taskOrder,
							meta: {},
							args: {}
						})
					}
				);

				const workflowTaskResult = await workflowTaskResponse.json();

				if (!workflowTaskResponse.ok) {
					console.error('Error while creating workflow task', workflowTaskResult);
					throw new AlertError(workflowTaskResult);
				}
				console.log('Workflow task created');

				// Get updated workflow with created task
				const workflowResponse = await fetch(
					`/api/v1/project/${project.id}/workflow/${workflow.id}`,
					{
						method: 'GET',
						credentials: 'include'
					}
				);

				const workflowResult = await workflowResponse.json();

				if (!workflowResponse.ok) {
					console.error('Error while retrieving workflow', workflowResult);
					throw new AlertError(workflowResult);
				}

				// Update workflow
				workflow = workflowResult;
				// UI Feedback
				workflowSuccessMessage = 'Workflow task created';
				resetCreateWorkflowTaskModal();
				await checkNewVersions();
			},
			() => {
				creatingWorkflowTask = false;
			}
		);
	}

	/**
	 * Deletes a project's workflow task from the server
	 * @returns {Promise<void>}
	 */
	async function handleDeleteWorkflowTask() {
		if (!workflow || !selectedWorkflowTask) {
			return;
		}
		const response = await fetch(
			`/api/v1/project/${project.id}/workflow/${workflow.id}/wftask/${selectedWorkflowTask.id}`,
			{
				method: 'DELETE',
				credentials: 'include'
			}
		);

		if (!response.ok) {
			const error = await response.json();
			console.error('Unable to delete workflow task', error);
			throw new AlertError(error);
		}

		// Discard unsaved changes when workflow task is deleted
		argumentsWithUnsavedChanges = false;

		// Get updated workflow with deleted task
		const workflowResponse = await fetch(`/api/v1/project/${project.id}/workflow/${workflow.id}`, {
			method: 'GET',
			credentials: 'include'
		});

		const workflowResult = await workflowResponse.json();

		if (!response.ok) {
			console.error('Unable to retrieve workflow', workflowResult);
			throw new AlertError(workflowResult);
		}

		// Successfully deleted task
		workflow = workflowResult;
		workflowTaskContext.set(undefined);
	}

	async function setActiveWorkflowTaskContext(event) {
		if (!workflow) {
			return;
		}
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
		unsavedChangesModal.toggle();
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

	let workflowTaskSorting = false;

	/**
	 * Reorders a project's workflow in the server
	 * @returns {Promise<*>}
	 */
	async function handleWorkflowOrderUpdate() {
		if (!workflow) {
			return;
		}
		const patchData = {
			reordered_workflowtask_ids: updatableWorkflowList.map((t) => t.id)
		};

		workflowTaskSorting = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v1/project/${project.id}/workflow/${workflow.id}`, {
			method: 'PATCH',
			credentials: 'include',
			mode: 'cors',
			headers,
			body: JSON.stringify(patchData)
		});
		workflowTaskSorting = false;

		const result = await response.json();
		if (response.ok) {
			console.log('Workflow task order updated');
			workflow = result;
			editWorkflowTasksOrderModal.toggle();
		} else {
			console.error('Workflow task order not updated', result);
			editWorkflowTasksOrderModal.displayErrorAlert(result);
		}
	}

	let applyingWorkflow = false;

	/**
	 * Requests the server to apply a project's workflow (i.e. run it)
	 * @returns {Promise<void>}
	 */
	async function handleApplyWorkflow() {
		// reset previous errors
		runWorkflowModal.hideErrorAlert();
		if (!workflow) {
			return;
		}
		if (inputDatasetControl === '') {
			// Preliminary check: if inputDatasetControl is not set, raise an error
			let message = 'Input dataset is required. Select one from the list.';
			console.error(message);
			runWorkflowModal.displayErrorAlert(message);
		} else if (outputDatasetControl === '') {
			// Preliminary check: if outputDatasetControl is not set, raise an error
			let message = 'Output dataset is required. Select one from the list.';
			console.error(message);
			runWorkflowModal.displayErrorAlert(message);
		} else {
			// Both inputDatasetControl and outputDatasetControl are set, continue
			const requestBody = {
				worker_init: workerInitControl,
				first_task_index: firstTaskIndexControl,
				last_task_index: lastTaskIndexControl
			};
			if (setSlurmAccount && slurmAccount !== '') {
				requestBody.slurm_account = slurmAccount;
			}

			applyingWorkflow = true;
			const headers = new Headers();
			headers.set('Content-Type', 'application/json');

			const response = await fetch(
				`/api/v1/project/${project.id}/workflow/${workflow.id}/apply?input_dataset_id=${inputDatasetControl}&output_dataset_id=${outputDatasetControl}`,
				{
					method: 'POST',
					credentials: 'include',
					headers,
					body: JSON.stringify(requestBody, replaceEmptyStrings)
				}
			);
			applyingWorkflow = false;

			// Handle API response
			if (response.ok) {
				// Successfully applied workflow
				// @ts-ignore
				// eslint-disable-next-line
				runWorkflowModal.toggle();
				// Navigate to project jobs page
				// Define URL to navigate to
				const jobsUrl = new URL(
					`projects/${project.id}/workflows/${workflow.id}/jobs`,
					window.location.origin
				);
				// Trigger navigation
				await goto(jobsUrl);
			} else {
				console.error(response);
				// Set an error message on the component
				runWorkflowModal.displayErrorAlert(await response.json());
			}
		}
	}

	function handleArgsSaved(event) {
		if (!selectedWorkflowTask) {
			return;
		}
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

	/**
	 * Called by VersionUpdate component at the end of the update to reload the workflow.
	 * @param workflowTask {import('$lib/types').WorkflowTask}
	 */
	async function taskUpdated(workflowTask) {
		if (!workflow) {
			return;
		}
		workflowSuccessMessage = '';
		if (workflowErrorAlert) {
			workflowErrorAlert.hide();
		}

		const workflowResponse = await fetch(`/api/v1/project/${project.id}/workflow/${workflow.id}`, {
			method: 'GET',
			credentials: 'include'
		});

		const workflowResult = await workflowResponse.json();

		if (!workflowResponse.ok) {
			workflowErrorAlert = displayStandardErrorAlert(
				'Error while retrieving workflow',
				'workflowErrorAlert'
			);
			return;
		}

		workflow = workflowResult;
		selectedWorkflowTask = workflowTask;
		workflowSuccessMessage = 'Task version updated successfully';
		await checkNewVersions();
	}

	async function checkNewVersions() {
		if (workflow) {
			newVersionsMap = await getAllNewVersions(workflow.task_list.map((wt) => wt.task));
		}
	}

	let newVersionsCount = 0;
	/**
	 * Used to receive new version count from VersionUpdate component.
	 * @param count {number}
	 */
	async function updateNewVersionsCount(count) {
		newVersionsCount = count;
	}

	onDestroy(unsubscribe);
</script>

<div class="d-flex justify-content-between align-items-center mb-4">
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
		<a href="/projects/{project?.id}/workflows/{workflow?.id}/jobs" class="btn btn-light">
			<i class="bi-journal-code" /> List jobs
		</a>
		<button class="btn btn-light" on:click|preventDefault={handleExportWorkflow}>
			<i class="bi-box-arrow-up" />
		</button>
		<a id="downloadWorkflowButton" class="d-none">Download workflow link</a>
		<button
			class="btn btn-light"
			data-bs-toggle="modal"
			data-bs-target="#editWorkflowModal"
			on:click={resetWorkflowUpdateModal}
		>
			<i class="bi-pencil" />
		</button>
		<button
			class="btn btn-success"
			on:click|preventDefault={() => {
				if (argumentsWithUnsavedChanges === false) {
					runWorkflowModal.toggle();
				} else {
					toggleUnsavedChangesModal();
				}
			}}
			><i class="bi-play-fill" /> Run workflow
		</button>
	</div>
</div>

{#if workflow}
	<StandardDismissableAlert message={workflowSuccessMessage} />

	<div id="workflowErrorAlert" />

	<div class="container mt-4 px-0">
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
								>
									<i class="bi-arrow-down-up" />
								</button>
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

									{#if newVersionsMap[workflowTask.task.id]?.length > 0}
										<span class="float-end text-warning" title="new version available">
											<i class="bi bi-exclamation-triangle" />
										</span>
									{/if}
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
											on:click={() => (workflowTabContextId = 0)}
											aria-current={workflowTabContextId === 0}
											>Arguments
										</button>
									</li>
									<li class="nav-item">
										<button
											data-bs-toggle="tab"
											data-bs-target="#meta-tab"
											class="nav-link {workflowTabContextId === 1 ? 'active' : ''}"
											on:click={() => (workflowTabContextId = 1)}
											aria-current={workflowTabContextId === 1}
											>Meta
										</button>
									</li>
									<li class="nav-item">
										<button
											data-bs-toggle="tab"
											data-bs-target="#info-tab"
											class="nav-link {workflowTabContextId === 2 ? 'active' : ''}"
											on:click={() => (workflowTabContextId = 2)}
											aria-current={workflowTabContextId === 2}
											>Info
										</button>
									</li>
									<li class="nav-item">
										<button
											data-bs-toggle="tab"
											data-bs-target="#version-tab"
											class="nav-link {workflowTabContextId === 3 ? 'active' : ''}"
											on:click={() => (workflowTabContextId = 3)}
											aria-current={workflowTabContextId === 3}
										>
											Version
											{#if newVersionsCount}
												<span class="badge bg-primary rounded-pill">{newVersionsCount}</span>
											{/if}
										</button>
									</li>
								</ul>
								<ConfirmActionButton
									modalId="confirmDeleteWorkflowTask"
									btnStyle="danger"
									buttonIcon="trash"
									message="Delete a workflow task {selectedWorkflowTask.task.name}"
									callbackAction={handleDeleteWorkflowTask}
								/>
							</div>
						{:else}
							Select a workflow task from the list
						{/if}
					</div>
					<div class="tab-content">
						{#if workflowTabContextId === 0}
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
						{:else if workflowTabContextId === 1}
							<div id="meta-tab" class="tab-pane show active">
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
						{:else if workflowTabContextId === 2}
							<div id="info-tab" class="tab-pane show active">
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
											<li class="list-group-item">
												<code>{selectedWorkflowTask.task.source}</code>
											</li>
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
						{/if}
						<div
							id="version-tab"
							class="tab-pane"
							class:show={workflowTabContextId === 3}
							class:active={workflowTabContextId === 3}
						>
							<div class="card-body">
								{#if selectedWorkflowTask}
									<VersionUpdate
										workflowTask={selectedWorkflowTask}
										updateWorkflowCallback={taskUpdated}
										{updateNewVersionsCount}
									/>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<Modal id="insertTaskModal" centered={true} bind:this={insertTaskModal}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">New workflow task</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-insertTaskModal" />
		<form on:submit|preventDefault={handleCreateWorkflowTask}>
			<div class="mb-3">
				<WorkflowTaskSelection tasks={availableTasks} bind:this={workflowTaskSelectionComponent} />
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
					bind:value={taskOrder}
				/>
			</div>

			<button class="btn btn-primary" type="submit" disabled={creatingWorkflowTask}>
				{#if creatingWorkflowTask}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
				{/if}
				Insert
			</button>
		</form>
	</svelte:fragment>
</Modal>

<Modal id="editWorkflowModal" centered={true} bind:this={editWorkflowModal}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Workflow properties</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-editWorkflowModal" />
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
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-primary" form="updateWorkflow" disabled={workflowUpdating}>
			{#if workflowUpdating}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
			{/if}
			Save
		</button>
	</svelte:fragment>
</Modal>

<Modal id="editWorkflowTasksOrderModal" centered={true} bind:this={editWorkflowTasksOrderModal}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Edit workflow tasks order</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-editWorkflowTasksOrderModal" />
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
											on:click|preventDefault={() => moveWorkflowTask(i, 'up')}
										>
											<i class="bi-arrow-up" />
										</button>
									{/if}
									{#if i !== updatableWorkflowList.length - 1}
										<button
											class="btn btn-light"
											on:click|preventDefault={() => moveWorkflowTask(i, 'down')}
										>
											<i class="bi-arrow-down" />
										</button>
									{/if}
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/key}
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button
			class="btn btn-primary"
			on:click|preventDefault={handleWorkflowOrderUpdate}
			disabled={workflowTaskSorting}
		>
			{#if workflowTaskSorting}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
			{/if}
			Save
		</button>
	</svelte:fragment>
</Modal>

<Modal id="runWorkflowModal" centered={true} bind:this={runWorkflowModal}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Run workflow</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-runWorkflowModal" />
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
						{#if firstTaskIndexControl === '' || wft.order >= parseInt(firstTaskIndexControl)}
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
			{#if $page.data.userInfo.slurm_accounts.length > 0}
				<div class="mb-3">
					<div class="form-check">
						<input
							class="form-check-input"
							type="checkbox"
							id="setSlurmAccount"
							bind:checked={setSlurmAccount}
						/>
						<label class="form-check-label" for="setSlurmAccount"> Set SLURM account </label>
					</div>
				</div>
				{#if setSlurmAccount}
					<div class="mb-3">
						<label for="slurmAccount" class="form-label">SLURM account</label>
						<select
							name="slurmAccount"
							id="slurmAccount"
							class="form-control"
							disabled={checkingConfiguration}
							bind:value={slurmAccount}
						>
							{#each $page.data.userInfo.slurm_accounts as account}
								<option>{account}</option>
							{/each}
						</select>
					</div>
				{/if}
			{/if}
		</form>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		{#if checkingConfiguration}
			<button
				class="btn btn-warning"
				on:click={() => {
					checkingConfiguration = false;
				}}>Cancel</button
			>
			<button
				class="btn btn-primary"
				on:click|preventDefault={handleApplyWorkflow}
				disabled={applyingWorkflow}
			>
				{#if applyingWorkflow}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
				{/if}
				Confirm
			</button>
		{:else}
			<button
				class="btn btn-primary"
				on:click={() => {
					checkingConfiguration = true;
				}}>Run</button
			>
		{/if}
	</svelte:fragment>
</Modal>

<Modal id="changes-unsaved-dialog" bind:this={unsavedChangesModal}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">There are argument changes unsaved</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<p>
			Do you want to save the changes made to the arguments of the current selected workflow task?
		</p>
	</svelte:fragment>
	<svelte:fragment slot="footer">
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
	</svelte:fragment>
</Modal>
