<script>
	import { page } from '$app/stores';
	import { AlertError, displayStandardErrorAlert, FormErrorHandler } from '$lib/common/errors';
	import { sortUserByEmailComparator } from '$lib/common/user_utilities';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import UserSettingsEditor from '$lib/components/v2/admin/UserSettingsEditor.svelte';
	import { onMount } from 'svelte';

	/** @type {import('$lib/types').Group & {user_ids: number[]}} */
	let group = $page.data.group;
	/** @type {Array<import('$lib/types').User & {id: number}>} */
	let users = $page.data.users;
	let runnerBackend = $page.data.runnerBackend;

	/** @type {import('$lib/types').User & {id: number}|null} */
	let draggedUser = null;
	/** @type {import('$lib/types').User & {id: number}|null} */
	let addingUser = null;
	let hovering = false;
	let userFilter = '';

	/** @type {import('$lib/types').UserSettings} */
	let settings = createEmptySettings();

	$: availableUsers = users
		.filter((u) => !group.user_ids.includes(u.id))
		.sort(sortUserByEmailComparator);

	$: filteredAvailableUsers = availableUsers.filter((u) =>
		u.email.toLowerCase().includes(userFilter.toLowerCase())
	);

	$: members = users.filter((u) => group.user_ids.includes(u.id)).sort(sortUserByEmailComparator);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/**
	 * @param {DragEvent} event
	 */
	async function handleDrop(event) {
		event.preventDefault();
		errorAlert?.hide();
		if (!draggedUser) {
			return;
		}

		const previousUserIs = [...group.user_ids]; // copy the old values

		addingUser = draggedUser;
		group = { ...group, user_ids: [...group.user_ids, draggedUser.id] };

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/auth/group/${group.id}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				new_user_ids: [addingUser.id]
			})
		});

		const result = await response.json();
		if (response.ok) {
			group = result;
		} else {
			// restore the old situation putting the user back to the available users list
			errorAlert = displayStandardErrorAlert(
				new AlertError(result, response.status),
				'editGroupError'
			);
			group = { ...group, user_ids: previousUserIs };
		}

		addingUser = null;
		hovering = false;
	}

	/** @type {string[]} */
	let editableViewPaths = [];
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
		editableViewPaths = viewer_paths;
		viewerPathsUpdatedMessage = 'Paths successfully updated';
	}

	onMount(() => {
		editableViewPaths = [...group.viewer_paths];
	});

	/**
	 * @returns {import('$lib/types').UserSettings}
	 */
	function createEmptySettings() {
		return {
			slurm_accounts: [],
			slurm_user: '',
			cache_dir: '',
			ssh_host: '',
			ssh_username: '',
			ssh_private_key_path: '',
			ssh_tasks_dir: '',
			ssh_jobs_dir: ''
		};
	}

	async function onSettingsUpdated() {
		settings = createEmptySettings();
	}
</script>

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
			class:hovering
			on:dragenter={() => (hovering = true)}
			on:dragleave={() => (hovering = false)}
			on:drop={(event) => handleDrop(event)}
			on:dragover={(event) => {
				event.preventDefault();
			}}
		>
			<div class="p-2">
				{#each members as user}
					<span class="badge text-bg-secondary me-2 mb-2 fw-normal fs-6">
						{user.email}
						{#if addingUser && addingUser.id === user.id}
							<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
						{/if}
					</span>
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
						on:dragstart={() => (draggedUser = user)}
						on:dragend={() => {
							draggedUser = null;
							hovering = false;
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
		<button class="btn btn-primary" on:click={saveViewerPaths}>Save</button>
	</div>
</div>

{#if runnerBackend !== 'local' && runnerBackend !== 'local_experimental'}
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
		{settings}
		{runnerBackend}
		settingsApiEndpoint="/api/auth/group/{group.id}/user-settings"
		{onSettingsUpdated}
	/>
{/if}
