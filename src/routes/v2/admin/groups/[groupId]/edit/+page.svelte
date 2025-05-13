<script>
	import { page } from '$app/state';
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
	let group = $state(page.data.group);
	/** @type {Array<import('fractal-components/types/api').User & {id: number}>} */
	const users = $derived(page.data.users);
	const runnerBackend = $derived(page.data.runnerBackend);

	/** @type {import('fractal-components/types/api').User & {id: number}|null} */
	let draggedUserToAdd = $state(null);
	/** @type {import('fractal-components/types/api').User & {id: number}|null} */
	let addingUser = $state(null);
	let addUserHovering = $state(false);
	let userFilter = $state('');
	/** @type {import('$lib/components/v2/admin/UserSettingsEditor.svelte').default|undefined} */
	let userSettingsEditor = $state();
	let settingsUpdatedMessage = $state('');
	let settingsPendingChanges = $state(false);
	let savingSettings = $state(false);

	/** @type {import('fractal-components/types/api').User & {id: number}|null} */
	let draggedUserToRemove = $state(null);

	/** @type {import('fractal-components/types/api').UserSettings} */
	let settings = $state(createEmptySettings());

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
	let editableViewPaths = $state([]);
	/** @type {string[]} */
	let originalViewPaths = $state([]);
	let viewerPathsUpdatedMessage = $state('');
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
			await userSettingsEditor?.handleSaveSettings();
		} finally {
			savingSettings = false;
		}
	}
	let availableUsers = $derived(
		users.filter((u) => !group.user_ids.includes(u.id)).sort(sortUserByEmailComparator)
	);
	let filteredAvailableUsers = $derived(
		availableUsers.filter((u) => u.email.toLowerCase().includes(userFilter.toLowerCase()))
	);
	let members = $derived(
		users.filter((u) => group.user_ids.includes(u.id)).sort(sortUserByEmailComparator)
	);
	let saveViewerPathsEnabled = $derived(
		JSON.stringify(originalViewPaths) !== JSON.stringify(editableViewPaths)
	);
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

	<div id="editGroupError"></div>

	<div class="row mt-4">
		<div class="col-6">
			<h4 class="fw-light">Members of the group</h4>
			<div
				class="droparea bg-light p-2"
				id="members-container"
				role="region"
				class:addUserHovering
				ondragenter={() => (addUserHovering = true)}
				ondragleave={() => (addUserHovering = false)}
				ondrop={(event) => handleDrop(event)}
				ondragover={(event) => {
					event.preventDefault();
				}}
			>
				<div class="p-2">
					{#each members as user (user.id)}
						{#if group.name === 'All'}
							<span class="badge text-bg-secondary me-2 mb-2 fw-normal fs-6">
								{user.email}
								{#if addingUser && addingUser.id === user.id}
									<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
									></span>
								{/if}
							</span>
						{:else}
							<button
								class="btn btn-secondary ps-1 pe-0 pt-0 pb-0 me-2 mb-2 user-badge"
								draggable={true}
								ondragstart={() => (draggedUserToRemove = user)}
								ondragend={(event) => handleDroppedUserToRemove(event)}
							>
								<span class="user-text">
									{user.email}
								</span>
								{#if addingUser && addingUser.id === user.id}
									<span
										class="spinner-border spinner-border-sm me-2"
										role="status"
										aria-hidden="true"
									></span>
								{:else}
									<!-- svelte-ignore node_invalid_placement_ssr -->
									<button
										class="text-danger remove-user-btn btn ms-1 ps-1 pe-1"
										aria-label="Remove user {user.email}"
										onclick={() => removeUser(user.id)}
									>
										<i class="bi bi-x"></i>
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
					{#each filteredAvailableUsers as user (user.id)}
						<button
							class="btn btn-outline-secondary ps-1 pe-2 pt-0 pb-0 me-2 mb-2"
							draggable={true}
							ondragstart={() => (draggedUserToAdd = user)}
							ondragend={() => {
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
			<!-- eslint-disable-next-line no-unused-vars -->
			{#each editableViewPaths as _, i (i)}
				<div class="input-group mb-2">
					<input
						type="text"
						class="form-control"
						id={`viewerPath-${i}`}
						bind:value={editableViewPaths[i]}
						aria-label={`Viewer path #${i + 1}`}
						required
					/>
					<button
						class="btn btn-outline-secondary"
						type="button"
						id="viewer_path_remove_{i}"
						aria-label={`Remove viewer path #${i + 1}`}
						onclick={() => removeViewerPath(i)}
					>
						<i class="bi bi-trash"></i>
					</button>
				</div>
			{/each}
			<button class="btn btn-secondary mb-2" onclick={addViewerPath}>Add viewer path</button>
			<div id="viewerPathGenericError"></div>
			{#if $viewerPathsValidationErrors['viewer_paths']}
				<div class="alert alert-danger mb-2">
					{$viewerPathsValidationErrors['viewer_paths']}
				</div>
			{/if}
			<StandardDismissableAlert message={viewerPathsUpdatedMessage} />
			<button class="btn btn-primary" onclick={saveViewerPaths} disabled={!saveViewerPathsEnabled}>
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
						<i class="bi bi-exclamation-triangle"></i>
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
						onclick={handleSaveSettings}
						class="btn btn-primary"
						disabled={savingSettings || !settingsPendingChanges}
					>
						{#if savingSettings}
							<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
							></span>
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
