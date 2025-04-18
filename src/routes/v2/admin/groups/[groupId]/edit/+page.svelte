<script>
	import { page } from '$app/stores';
	import {
		displayStandardErrorAlert,
		FormErrorHandler,
		getAlertErrorFromResponse
	} from '$lib/common/errors';
	import { sortUserByEmailComparator } from '$lib/common/user_utilities';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import UserSettingsEditor from '$lib/components/v2/admin/UserSettingsEditor.svelte';
	import { onMount } from 'svelte';

	/** @type {import('fractal-components/types/api').Group & {user_ids: number[]}} */
	let group = $page.data.group;
	/** @type {Array<import('fractal-components/types/api').User & {id: number}>} */
	let users = $page.data.users;
	let runnerBackend = $page.data.runnerBackend;

	/** @type {import('fractal-components/types/api').User & {id: number}|null} */
	let draggedUserToAdd = null;
	/** @type {import('fractal-components/types/api').User & {id: number}|null} */
	let addingUser = null;
	let addUserHovering = false;
	let userFilter = '';
	/** @type {import('$lib/components/v2/admin/UserSettingsEditor.svelte').default} */
	let userSettingsEditor;
	let settingsUpdatedMessage = '';
	let settingsPendingChanges = false;
	let savingSettings = false;

	/** @type {import('fractal-components/types/api').User & {id: number}|null} */
	let draggedUserToRemove = null;

	/** @type {import('fractal-components/types/api').UserSettings} */
	let settings = createEmptySettings();

	$: availableUsers = users
		.filter((u) => !group.user_ids.includes(u.id))
		.sort(sortUserByEmailComparator);

	$: filteredAvailableUsers = availableUsers.filter((u) =>
		u.email.toLowerCase().includes(userFilter.toLowerCase())
	);

	$: members = users.filter((u) => group.user_ids.includes(u.id)).sort(sortUserByEmailComparator);

	$: saveViewerPathsEnabled =
		JSON.stringify(originalViewPaths) !== JSON.stringify(editableViewPaths);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/**
	 * @param {DragEvent} event
	 */
	async function handleDrop(event) {
		event.preventDefault();
		errorAlert?.hide();
		if (!draggedUserToAdd) {
			return;
		}

		const previousUserIs = [...group.user_ids]; // copy the old values

		addingUser = draggedUserToAdd;
		group = { ...group, user_ids: [...group.user_ids, draggedUserToAdd.id] };

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/auth/group/${group.id}/add-user/${addingUser.id}`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({})
		});

		if (response.ok) {
			group = await response.json();
		} else {
			// restore the old situation putting the user back to the available users list
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'editGroupError'
			);
			group = { ...group, user_ids: previousUserIs };
		}

		addingUser = null;
		draggedUserToAdd = null;
		addUserHovering = false;
	}

	async function handleDroppedUserToRemove(event) {
		if (!draggedUserToRemove || isMouseInMembersContainer(event)) {
			return;
		}
		await removeUser(draggedUserToRemove.id);
		draggedUserToRemove = null;
	}

	/**
	 * @param {number} userId
	 */
	async function removeUser(userId) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/auth/group/${group.id}/remove-user/${userId}`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({})
		});

		if (response.ok) {
			group = await response.json();
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'editGroupError'
			);
		}
	}

	function isMouseInMembersContainer(event) {
		const container = document.getElementById('members-container');
		if (!container) {
			return false;
		}
		const rect = container.getBoundingClientRect();
		return (
			event.clientX >= rect.left &&
			event.clientX <= rect.right &&
			event.clientY >= rect.top &&
			event.clientY <= rect.bottom
		);
	}

	/** @type {string[]} */
	let editableViewPaths = [];
	/** @type {string[]} */
	let originalViewPaths = [];
	let viewerPathsUpdatedMessage = '';
	const viewerPathsErrorHandler = new FormErrorHandler('viewerPathGenericError', ['viewer_paths']);
	const viewerPathsValidationErrors = viewerPathsErrorHandler.getValidationErrorStore();

	function addViewerPath() {
		editableViewPaths = [...editableViewPaths, ''];
	}

	/**
	 * @param {number} index
	 */
	function removeViewerPath(index) {
		editableViewPaths = editableViewPaths.filter((_, i) => i !== index);
	}

	async function saveViewerPaths() {
		viewerPathsUpdatedMessage = '';
		viewerPathsErrorHandler.clearErrors();
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/auth/group/${group.id}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				viewer_paths: [...editableViewPaths]
			})
		});
		if (!response.ok) {
			await viewerPathsErrorHandler.handleErrorResponse(response);
			return;
		}
		const { viewer_paths } = await response.json();
		editableViewPaths = [...viewer_paths];
		originalViewPaths = [...viewer_paths];
		viewerPathsUpdatedMessage = 'Paths successfully updated';
	}

	onMount(() => {
		editableViewPaths = [...group.viewer_paths];
		originalViewPaths = [...group.viewer_paths];
	});

	/**
	 * @returns {import('fractal-components/types/api').UserSettings}
	 */
	function createEmptySettings() {
		return {
			slurm_accounts: [],
			project_dir: '',
			slurm_user: '',
			ssh_host: '',
			ssh_username: '',
			ssh_private_key_path: '',
			ssh_tasks_dir: '',
			ssh_jobs_dir: ''
		};
	}

	async function onSettingsUpdated() {
		settings = createEmptySettings();
		settingsUpdatedMessage = 'Settings successfully updated';
	}

	async function handleSaveSettings() {
		settingsUpdatedMessage = '';
		savingSettings = true;
		try {
			await userSettingsEditor.handleSaveSettings();
		} finally {
			savingSettings = false;
		}
	}
</script>

<div class="container mt-3">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item">
				<a href="/v2/admin">Admin area</a>
			</li>
			<li class="breadcrumb-item">
				<a href="/v2/admin/groups">Manage groups</a>
			</li>
			<li class="breadcrumb-item active" aria-current="page">
				Editing group #{group.id} ({group.name})
			</li>
		</ol>
	</nav>

	<div id="editGroupError" />

	<div class="row mt-4">
		<div class="col-6">
			<h4 class="fw-light">Members of the group</h4>
			<div
				class="droparea bg-light p-2"
				id="members-container"
				role="region"
				class:addUserHovering
				on:dragenter={() => (addUserHovering = true)}
				on:dragleave={() => (addUserHovering = false)}
				on:drop={(event) => handleDrop(event)}
				on:dragover={(event) => {
					event.preventDefault();
				}}
			>
				<div class="p-2">
					{#each members as user}
						{#if group.name === 'All'}
							<span class="badge text-bg-secondary me-2 mb-2 fw-normal fs-6">
								{user.email}
								{#if addingUser && addingUser.id === user.id}
									<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
								{/if}
							</span>
						{:else}
							<button
								class="btn btn-secondary ps-1 pe-0 pt-0 pb-0 me-2 mb-2 user-badge"
								draggable={true}
								on:dragstart={() => (draggedUserToRemove = user)}
								on:dragend={(event) => handleDroppedUserToRemove(event)}
							>
								<span class="user-text">
									{user.email}
								</span>
								{#if addingUser && addingUser.id === user.id}
									<span
										class="spinner-border spinner-border-sm me-2"
										role="status"
										aria-hidden="true"
									/>
								{:else}
									<button
										class="text-danger remove-user-btn btn ms-1 ps-1 pe-1"
										aria-label="Remove user {user.email}"
										on:click={() => removeUser(user.id)}
									>
										<i class="bi bi-x" />
									</button>
								{/if}
							</button>
						{/if}
					{/each}
				</div>
				<p class="text-center mt-1 mb-1">drag the users here</p>
			</div>
		</div>
		<div class="col-6">
			<h4 class="fw-light mb-3">Available users</h4>
			{#if availableUsers.length > 0}
				<div class="mb-2">
					<input
						type="text"
						bind:value={userFilter}
						class="form-control"
						placeholder="Filter users"
					/>
				</div>
				<div>
					{#each filteredAvailableUsers as user}
						<button
							class="btn btn-outline-secondary ps-1 pe-2 pt-0 pb-0 me-2 mb-2"
							draggable={true}
							on:dragstart={() => (draggedUserToAdd = user)}
							on:dragend={() => {
								draggedUserToAdd = null;
								addUserHovering = false;
							}}
							disabled={addingUser !== null}
						>
							{user.email}
						</button>
					{/each}
				</div>
			{:else}
				<p>No more users available</p>
			{/if}
		</div>
	</div>

	<div class="row mt-4 mb-4">
		<div class="col-lg-9">
			<h4 class="fw-light">Viewer paths</h4>
			{#each editableViewPaths as viewerPath, i}
				<div class="input-group mb-2">
					<input
						type="text"
						class="form-control"
						id={`viewerPath-${i}`}
						bind:value={viewerPath}
						aria-label={`Viewer path #${i + 1}`}
						required
					/>
					<button
						class="btn btn-outline-secondary"
						type="button"
						id="viewer_path_remove_{i}"
						aria-label={`Remove viewer path #${i + 1}`}
						on:click={() => removeViewerPath(i)}
					>
						<i class="bi bi-trash" />
					</button>
				</div>
			{/each}
			<button class="btn btn-secondary mb-2" on:click={addViewerPath}>Add viewer path</button>
			<div id="viewerPathGenericError" />
			{#if $viewerPathsValidationErrors['viewer_paths']}
				<div class="alert alert-danger mb-2">
					{$viewerPathsValidationErrors['viewer_paths']}
				</div>
			{/if}
			<StandardDismissableAlert message={viewerPathsUpdatedMessage} />
			<button class="btn btn-primary" on:click={saveViewerPaths} disabled={!saveViewerPathsEnabled}>
				Save
			</button>
		</div>
	</div>

	<hr />
	<div class="row">
		<div class="mt-4 col-lg-7">
			<div class="row">
				<div class="offset-sm-3">
					<h4 class="fw-light">Users settings</h4>
				</div>
			</div>
			<div class="row">
				<div class="offset-sm-3 col-10">
					<div class="alert alert-warning">
						<i class="bi bi-exclamation-triangle" />
						<strong>Warning</strong>: this PATCH will be applied to all the {group.user_ids.length} users
						of this user group.
					</div>
				</div>
			</div>
		</div>
	</div>
	<UserSettingsEditor
		bind:this={userSettingsEditor}
		bind:pendingChanges={settingsPendingChanges}
		{settings}
		{runnerBackend}
		settingsApiEndpoint="/api/auth/group/{group.id}/user-settings"
		{onSettingsUpdated}
	/>
	<div class="row">
		<div class="mt-2 col-lg-7">
			<div class="row mb-3">
				<div class="col-sm-9 offset-sm-3">
					<StandardDismissableAlert message={settingsUpdatedMessage} />
					<button
						type="button"
						on:click={handleSaveSettings}
						class="btn btn-primary"
						disabled={savingSettings || !settingsPendingChanges}
					>
						{#if savingSettings}
							<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
						{/if}
						Save
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.user-badge {
		padding-right: 0;
		cursor: pointer;
	}

	.remove-user-btn {
		padding-top: 2px;
		padding-bottom: 1px;
		background-color: #eee;
		border-radius: 0 5px 5px 0;
	}
</style>
