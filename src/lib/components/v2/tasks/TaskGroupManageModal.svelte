<script>
	import { goto } from '$app/navigation';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '../../common/Modal.svelte';
	import { resolve } from '$app/paths';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} admin
	 * @property {string} [coreSuccessMessage]
	 */

	/** @type {Props} */
	let { admin, coreSuccessMessage = $bindable('') } = $props();

	/** @type {Modal|undefined} */
	let modal = $state();

	/** @type {import('fractal-components/types/api').TaskGroupSlim|undefined} */
	let taskGroup = $state(undefined);
	let originalActive = $state(true);

	let saving = $state(false);
	let askConfirmForDeactivate = $state(false);
	let askConfirmForDelete = $state(false);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/**
	 * @param {import('fractal-components/types/api').TaskGroupSlim} taskGroupToEdit
	 */
	export async function open(taskGroupToEdit) {
		taskGroup = taskGroupToEdit;
		originalActive = taskGroupToEdit.active;
		askConfirmForDeactivate = false;
		askConfirmForDelete = false;
		errorAlert?.hide();
		modal?.show();
	}

	/**
	 * @param {boolean} active
	 */
	async function handleEditTaskGroup(active) {
		errorAlert?.hide();
		saving = true;
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		const response = await fetch(
			`/api/${admin ? 'admin/' : ''}v2/task-group/${taskGroup?.id}/${
				active ? 'reactivate' : 'deactivate'
			}`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify({})
			}
		);

		await handleActivityResponse(response);
	}

	async function handleDeleteTaskGroup() {
		errorAlert?.hide();
		saving = true;
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		const response = await fetch(
			`/api/${admin ? 'admin/' : ''}v2/task-group/${taskGroup?.id}/delete`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify({})
			}
		);

		await handleActivityResponse(response);
	}

	/**
	 * @param {Response} response
	 */
	async function handleActivityResponse(response) {
		if (response.ok) {
			const result = await response.json();
			saving = false;
			await goto(
				resolve(
					admin
						? `/v2/admin/task-groups/activities?activity_id=${result.id}`
						: `/v2/tasks/activities?activity_id=${result.id}`
				)
			);
			modal?.hide();
		} else {
			saving = false;
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'taskGroupManageError'
			);
		}
	}

	/**
	 * @param {number} taskGroupId
	 */
	async function makeCore(taskGroupId) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/admin/v2/task-group/${taskGroupId}/make-core`, {
			method: 'POST',
			headers
		});
		if (!response.ok) {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'taskGroupManageError'
			);
		} else {
			coreSuccessMessage = `All tasks of task group ${taskGroupId} have been set to core.`;
			modal?.hide();
		}
	}

	/**
	 * @param {number} taskGroupId
	 */
	async function makeNotCore(taskGroupId) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/admin/v2/task-group/${taskGroupId}/make-not-core`, {
			method: 'POST',
			headers
		});
		if (!response.ok) {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'taskGroupManageError'
			);
		} else {
			coreSuccessMessage = `All tasks of task group ${taskGroupId} have been set to not core.`;
			modal?.hide();
		}
	}
</script>

<Modal id="taskGroupManageModal" bind:this={modal} size="lg">
	{#snippet header()}
		{#if taskGroup}
			<h1 class="h5 modal-title">
				Task group {taskGroup.pkg_name}
				(version {taskGroup.version ? taskGroup.version : 'None'})
			</h1>
		{/if}
	{/snippet}
	{#snippet body()}
		{#if askConfirmForDeactivate}
			<div class="row">
				<div class="col">
					<div class="alert alert-warning">
						<i class="bi bi-exclamation-triangle"></i>
						Warning: after a task-group is marked as non-active, jobs that include its tasks cannot be
						submitted any more. Do you want to proceed?
					</div>
				</div>
			</div>
			<div class="row">
				<div class="col">
					<button
						class="btn btn-primary"
						onclick={() => handleEditTaskGroup(false)}
						disabled={saving}
					>
						{#if saving}
							<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true">
							</span>
						{/if}
						Confirm
					</button>
				</div>
			</div>
		{:else if askConfirmForDelete}
			<div class="row">
				<div class="col">
					<div class="alert alert-warning">
						<i class="bi bi-exclamation-triangle"></i>
						Warning: this will both delete task-group metadata and (if applicable) the task-group folder.
						Do you want to proceed?
					</div>
				</div>
			</div>
			<div class="row">
				<div class="col">
					<button class="btn btn-danger" onclick={() => handleDeleteTaskGroup()} disabled={saving}>
						{#if saving}
							<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true">
							</span>
						{/if}
						Confirm delete
					</button>
				</div>
			</div>
		{:else if taskGroup}
			<div class="row mb-3">
				<div class="col">
					The task group is currently {originalActive ? '' : ' not'} active
				</div>
			</div>
			<div class="row">
				<div class="col">
					{#if originalActive}
						<button class="btn btn-primary" onclick={() => (askConfirmForDeactivate = true)}>
							Deactivate task group
						</button>
					{:else}
						<button class="btn btn-primary" onclick={() => handleEditTaskGroup(true)}>
							Reactivate task group
						</button>
						{#if admin}
							<a href="/v2/admin/task-groups/{taskGroup?.id}/reset" class="btn btn-primary">
								Reset task group
							</a>
						{/if}
					{/if}
				</div>
			</div>
			<div class="row">
				<div class="col">
					<hr />
					<button class="btn btn-danger" onclick={() => (askConfirmForDelete = true)}>
						Delete task group
					</button>
				</div>
			</div>
			{#if admin}
				<div class="row mb-2">
					<div class="col">
						<hr />
						<button
							class="btn btn-outline-secondary"
							onclick={async () => {
								if (taskGroup?.id) {
									await makeCore(taskGroup?.id);
								}
							}}
							aria-label="Make all core"
						>
							<i class="bi bi-patch-check-fill verified-core-icon"></i>
							Make core
						</button>
						<button
							class="btn btn-outline-secondary"
							onclick={async () => {
								if (taskGroup?.id) {
									await makeNotCore(taskGroup?.id);
								}
							}}
							aria-label="Make all not core"
						>
							<i class="bi bi-patch-check"></i>
							Make not core
						</button>
					</div>
				</div>
			{/if}
		{/if}
		<div id="taskGroupManageError" class="mt-3"></div>
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
	{/snippet}
</Modal>

<style>
	.verified-core-icon {
		color: #1da1f2;
		line-height: 1;
	}
</style>
