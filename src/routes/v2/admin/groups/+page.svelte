<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getAlertErrorFromResponse, getFieldValidationError } from '$lib/common/errors';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import Modal from '$lib/components/common/Modal.svelte';

	/** @type {Array<import('$lib/types').Group & {user_ids: number[]}>} */
	$: groups = $page.data.groups;

	/** @type {Modal} */
	let createGroupModal;

	let newGroupName = '';
	let newGroupNameError = '';
	let creatingGroup = false;

	function openCreateGroupModal() {
		newGroupName = '';
		newGroupNameError = '';
		createGroupModal.hideErrorAlert();
		createGroupModal.show();
	}

	async function handleCreateGroup() {
		createGroupModal.hideErrorAlert();
		newGroupNameError = '';
		creatingGroup = true;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/auth/group`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				name: newGroupName
			})
		});

		const result = await response.json();
		creatingGroup = false;
		if (response.ok) {
			newGroupName = '';
			groups = [...groups, result];
			createGroupModal.hide();
			goto(`/v2/admin/groups/${result.id}/edit`);
		} else {
			const error = getFieldValidationError(result, response.status);
			if (error) {
				newGroupNameError = error;
			} else {
				createGroupModal.displayErrorAlert(result);
			}
		}
	}

	/**
	 * @param {number} groupId
	 */
	async function handleGroupDelete(groupId) {
		const response = await fetch(`/api/auth/group/${groupId}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (response.ok) {
			groups = groups.filter((g) => g.id !== groupId);
		} else {
			console.error('Error while deleting group');
			throw await getAlertErrorFromResponse(response);
		}
	}
</script>

<button class="btn btn-primary float-end" on:click={openCreateGroupModal}>
	Create new group
</button>

<h1 class="fw-light">Groups list</h1>

<table class="table mt-3">
	<thead>
		<tr>
			<th>Id</th>
			<th>Name</th>
			<th>Number of users</th>
			<th>Number of viewer paths</th>
			<th>Actions</th>
		</tr>
	</thead>
	<tbody>
		{#each groups as group}
			<tr>
				<td>{group.id}</td>
				<td>{group.name}</td>
				<td>{group.user_ids.length}</td>
				<td>{group.viewer_paths.length}</td>
				<td>
					<a href="/v2/admin/groups/{group.id}" class="btn btn-light">
						<i class="bi-info-circle" /> Info
					</a>
					<a href="/v2/admin/groups/{group.id}/edit" class="btn btn-primary">
						<i class="bi bi-pencil" /> Edit
					</a>
					{#if group.name !== 'All'}
						<ConfirmActionButton
							modalId="confirmGroupDeleteModal{group.id}"
							style={'danger'}
							btnStyle="danger"
							buttonIcon="trash"
							label={'Delete'}
							message={`Delete group ${group.name}`}
							callbackAction={() => handleGroupDelete(group.id)}
						/>
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<Modal id="createGroupModal" bind:this={createGroupModal} centered={true}>
	<svelte:fragment slot="header">
		<h1 class="modal-title fs-5">Create new group</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-createGroupModal" />
		<form class="row" on:submit|preventDefault={handleCreateGroup} id="create-group-form">
			<div class="row mb-3">
				<label for="groupName" class="col-md-3 col-form-label">Group name</label>
				<div class="col-md-9">
					<input
						id="groupName"
						type="text"
						bind:value={newGroupName}
						class="form-control"
						class:is-invalid={newGroupNameError}
						required
					/>
					{#if newGroupNameError}
						<div class="invalid-feedback">{newGroupNameError}</div>
					{/if}
				</div>
			</div>
		</form>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button class="btn btn-primary" form="create-group-form" disabled={creatingGroup}>
			{#if creatingGroup}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
			{/if}
			Create
		</button>
	</svelte:fragment>
</Modal>
