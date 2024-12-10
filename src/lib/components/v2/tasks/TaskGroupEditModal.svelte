<script>
	import { nullifyEmptyStrings } from '$lib/common/component_utilities';
	import { FormErrorHandler } from '$lib/common/errors';
	import Modal from '../../common/Modal.svelte';
	import TaskGroupSelector from './TaskGroupSelector.svelte';

	/** @type {Array<[number, string]>} */
	export let groupIdsNames;
	/**
	 * @type {(updatedGroups: import('fractal-components/types/api').TaskGroupV2) => void}
	 */
	export let updateEditedTaskGroup;

	/** @type {Modal} */
	let modal;

	/** @type {import('fractal-components/types/api').TaskGroupV2|undefined} */
	let taskGroup = undefined;

	let privateTask = false;
	let selectedGroup = null;

	let saving = false;

	const formErrorHandler = new FormErrorHandler('taskGroupUpdateError', ['user_group_id']);

	const validationErrors = formErrorHandler.getValidationErrorStore();

	/**
	 * @param {import('fractal-components/types/api').TaskGroupV2} taskGroupToEdit
	 */
	export async function open(taskGroupToEdit) {
		taskGroup = taskGroupToEdit;
		privateTask = taskGroupToEdit.user_group_id === null;
		selectedGroup = taskGroupToEdit.user_group_id;
		formErrorHandler.clearErrors();
		modal.show();
	}

	async function handleUpdate() {
		modal.confirmAndHide(
			async () => {
				saving = true;

				const taskGroupProperties = nullifyEmptyStrings({
					user_group_id: privateTask ? null : selectedGroup
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
		{#if taskGroup}
			<h1 class="h5 modal-title">
				Task group {taskGroup.pkg_name}
				(version {taskGroup.version ? taskGroup.version : 'None'})
			</h1>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="body">
		{#if taskGroup}
			<div class="mb-2 row">
				<div class="col">
					{#key taskGroup}
						<TaskGroupSelector
							id="edit-{taskGroup.id}"
							{groupIdsNames}
							bind:privateTask
							bind:selectedGroup
							wrapperClass="mb-1"
						/>
					{/key}
					<span class="invalid-feedback">{$validationErrors['user_group_id']}</span>
				</div>
			</div>
			<span id="taskGroupUpdateError" />
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-primary" on:click={handleUpdate} disabled={saving}>
			{#if saving}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
			{/if}
			Update
		</button>
		<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
	</svelte:fragment>
</Modal>
