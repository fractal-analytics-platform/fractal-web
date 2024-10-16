<script>
	import { nullifyEmptyStrings } from '$lib/common/component_utilities';
	import { FormErrorHandler } from '$lib/common/errors';
	import Modal from '../../common/Modal.svelte';
	import TaskGroupSelector from './TaskGroupSelector.svelte';

	/** @type {import('$lib/types').User} */
	export let user;
	/**
	 * @type {(updatedGroups: import('$lib/types-v2').TaskGroupV2) => void}
	 */
	export let updateEditedTaskGroup;

	/** @type {Modal} */
	let modal;

	/** @type {import('$lib/types-v2').TaskGroupV2|undefined} */
	let taskGroup = undefined;
	let active = true;

	let privateTask = false;
	let selectedGroup = null;

	let saving = false;

	/**
	 * @param {import('$lib/types-v2').TaskGroupV2} taskGroupToEdit
	 */
	export async function open(taskGroupToEdit) {
		taskGroup = taskGroupToEdit;
		privateTask = taskGroupToEdit.user_group_id === null;
		selectedGroup = taskGroupToEdit.user_group_id;
		active = taskGroupToEdit.active;
		modal.show();
	}

	const formErrorHandler = new FormErrorHandler('taskGroupUpdateError', [
		'user_group_id',
		'active'
	]);

	const validationErrors = formErrorHandler.getValidationErrorStore();

	async function handleEditTaskGroup() {
		modal.confirmAndHide(
			async () => {
				saving = true;

				const taskGroupProperties = nullifyEmptyStrings({
					user_group_id: privateTask ? null : selectedGroup,
					active
				});

				const headers = new Headers();
				headers.append('Content-Type', 'application/json');

				const response = await fetch(`/api/v2/task-group/${taskGroup?.id}`, {
					method: 'PATCH',
					credentials: 'include',
					headers,
					body: JSON.stringify(taskGroupProperties)
				});

				if (!response.ok) {
					await formErrorHandler.handleErrorResponse(response);
				}

				updateEditedTaskGroup(await response.json());
			},
			() => {
				saving = false;
			}
		);
	}
</script>

<Modal id="taskGroupEditModal" bind:this={modal} size="lg">
	<svelte:fragment slot="header">
		<h1 class="h5 modal-title">Task group {taskGroup?.pkg_name}</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		{#if taskGroup}
			<div class="mb-2 row">
				<div class="col">
					<TaskGroupSelector
						id="edit-{taskGroup.id}"
						{user}
						bind:privateTask
						bind:selectedGroup
						wrapperClass="mb-1"
					/>
					<span class="invalid-feedback">{$validationErrors['user_group_id']}</span>
				</div>
			</div>
			<div class="mb-2 row">
				<div class="col">
					<div class="form-check">
						<input
							class="form-check-input"
							type="checkbox"
							id="edit-task-active"
							bind:checked={active}
						/>
						<label class="form-check-label" for="edit-task-active"> Active </label>
					</div>
					<span class="invalid-feedback">{$validationErrors['active']}</span>
				</div>
			</div>
			<span id="taskGroupUpdateError" />
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-primary" on:click={handleEditTaskGroup} disabled={saving}>
			{#if saving}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
			{/if}
			Update
		</button>
		<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
	</svelte:fragment>
</Modal>
