<script>
	import { goto } from '$app/navigation';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '../../common/Modal.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} admin
	 */

	/** @type {Props} */
	let { admin } = $props();

	/** @type {Modal|undefined} */
	let modal = $state();

	/** @type {import('fractal-components/types/api').TaskGroupV2|undefined} */
	let taskGroup = $state(undefined);
	let originalActive = $state(true);

	let saving = $state(false);
	let askConfirm = $state(false);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/**
	 * @param {import('fractal-components/types/api').TaskGroupV2} taskGroupToEdit
	 */
	export async function open(taskGroupToEdit) {
		taskGroup = taskGroupToEdit;
		originalActive = taskGroupToEdit.active;
		askConfirm = false;
		errorAlert?.hide();
		modal?.show();
	}

	/**
	 * @param {boolean} active
	 */
	async function handleEditTaskGroup(active) {
		saving = true;
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		const response = await fetch(
			`/api/${admin ? 'admin/' : ''}v2/task-group/${taskGroup?.id}/${
				active ? 'reactivate' : 'deactivate'
			}/`,
			{
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify({})
			}
		);
		saving = false;

		if (response.ok) {
			const result = await response.json();
			const page = admin ? `/v2/admin/task-groups/activities` : `/v2/tasks/activities`;
			goto(`${page}?activity_id=${result.id}`);
			modal?.hide();
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'taskGroupManageError'
			);
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
		{#if askConfirm}
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
							<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
							></span>
						{/if}
						Confirm
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
						<button class="btn btn-primary" onclick={() => (askConfirm = true)}>
							Deactivate task group
						</button>
					{:else}
						<button class="btn btn-primary" onclick={() => handleEditTaskGroup(true)}>
							Reactivate task group
						</button>
					{/if}
				</div>
			</div>
		{/if}
		<span id="taskGroupManageError"></span>
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
	{/snippet}
</Modal>
