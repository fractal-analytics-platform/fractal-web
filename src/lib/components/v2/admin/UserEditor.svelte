<script>
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { deepCopy, nullifyEmptyStrings } from '$lib/common/component_utilities';
	import {
		displayStandardErrorAlert,
		FormErrorHandler,
		getAlertErrorFromResponse
	} from '$lib/common/errors';
	import { onMount } from 'svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import { sortGroupByNameAllFirstComparator } from '$lib/components/admin/user_utilities.js';
	import SlimSelect from 'slim-select';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import UserSettingsEditor from './UserSettingsEditor.svelte';

	/** @type {import('$lib/types').User & {group_ids_names: Array<[number, string]>}} */
	export let user;
	/** @type {Array<import('$lib/types').Group>} */
	export let groups = [];
	/** @type {import('$lib/types').UserSettings|null} */
	export let settings = null;
	/** @type {(user: import('$lib/types').User) => Promise<Response>} */
	export let saveUser;
	/** @type {string} */
	export let runnerBackend;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/** @type {import('$lib/types').User & {group_ids_names: Array<[number, string]>}} */
	let originalUser;
	let userPendingChanges = false;
	/** @type {number[]} */
	let groupIdsToAdd = [];

	/** @type {import('$lib/components/v2/admin/UserSettingsEditor.svelte').default|undefined} */
	let userSettingsEditor;
	let settingsPendingChanges;

	$: userGroups = user.group_ids_names
		.map((ni) => groups.filter((g) => g.id === ni[0])[0])
		.sort(sortGroupByNameAllFirstComparator);

	$: availableGroups = groups
		.filter((g) => !user.group_ids_names.map((ni) => ni[0]).includes(g.id))
		.filter((g) => !groupIdsToAdd.includes(g.id))
		.sort(sortGroupByNameAllFirstComparator);

	$: groupsToAdd = groupIdsToAdd
		.map((id) => groups.filter((g) => g.id === id)[0])
		.sort(sortGroupByNameAllFirstComparator);

	$: if (user) {
		userPendingChanges = JSON.stringify(originalUser) !== JSON.stringify(nullifyEmptyStrings(user));
	}

	$: enableSave =
		!saving &&
		(userPendingChanges || settingsPendingChanges || groupIdsToAdd.length > 0 || password);

	let password = '';
	let confirmPassword = '';

	let saving = false;
	let userFormSubmitted = false;

	let userUpdatedMessage = '';

	const userFormErrorHandler = new FormErrorHandler('genericUserError', [
		'email',
		'username',
		'password'
	]);

	const userValidationErrors = userFormErrorHandler.getValidationErrorStore();

	/** @type {Modal} */
	let confirmSuperuserChange;

	async function handleSave() {
		saving = true;
		userUpdatedMessage = '';
		try {
			userFormSubmitted = true;
			userFormErrorHandler.clearErrors();
			validateUserFields();
			if (Object.keys($userValidationErrors).length > 0) {
				return;
			}
			if (user.is_superuser === originalUser.is_superuser) {
				await confirmSave();
			} else {
				confirmSuperuserChange.show();
			}
		} finally {
			saving = false;
		}
	}

	async function confirmSave() {
		saving = true;
		confirmSuperuserChange.hide();
		try {
			let existing = !!user.id;
			const groupsSuccess = await addGroups();
			if (!groupsSuccess) {
				return;
			}
			if (userPendingChanges || password) {
				if (password) {
					user.password = password;
				}
				const response = await saveUser(user);
				if (!response.ok) {
					await userFormErrorHandler.handleErrorResponse(response);
					return;
				}
				const result = await response.json();
				if (result.id === $page.data.userInfo.id) {
					// If the user modifies their own account the userInfo cached in the store has to be reloaded
					await invalidateAll();
				}
				password = '';
				confirmPassword = '';
				if (existing) {
					user = { ...result };
					originalUser = deepCopy(user);
				} else {
					await goto(`/v2/admin/users/${result.id}/edit`);
				}
			}
			if (settingsPendingChanges && userSettingsEditor) {
				const settingsSuccess = await userSettingsEditor.handleSaveSettings();
				if (!settingsSuccess) {
					return;
				}
			}
			userUpdatedMessage = 'User successfully updated';
		} finally {
			saving = false;
		}
	}

	function validateUserFields() {
		if (!user.email) {
			userFormErrorHandler.addValidationError('email', 'Field is required');
		}
		validatePassword();
	}

	function validatePassword() {
		if (user.id && !password && !confirmPassword) {
			return;
		}
		if (!password) {
			userFormErrorHandler.addValidationError('password', 'Field is required');
		}
		if (password !== confirmPassword) {
			userFormErrorHandler.addValidationError('confirmPassword', "Passwords don't match");
		}
	}

	/** @type {Modal} */
	let addGroupModal;
	/** @type {SlimSelect|undefined} */
	let groupsSelector;
	let addGroupError = '';
	/** @type {number[]} */
	let selectedGroupsToAdd = [];

	function openAddGroupModal() {
		selectedGroupsToAdd = [];
		addGroupError = '';
		setSlimSelectOptions(groupsSelector, getGroupSlimSelectOptions());
		addGroupModal.show();
	}

	function getGroupSlimSelectOptions() {
		return availableGroups.map((g) => ({ id: g.id, name: g.name }));
	}

	async function addGroupToUser() {
		addGroupError = '';
		if (selectedGroupsToAdd.length === 0) {
			addGroupError = 'Group is required';
			return;
		}

		groupIdsToAdd = [...groupIdsToAdd, ...selectedGroupsToAdd];
		selectedGroupsToAdd = [];
		addGroupModal.hide();
	}

	/**
	 * @param {number} groupId
	 */
	function removeGroupToAdd(groupId) {
		groupIdsToAdd = groupIdsToAdd.filter((id) => id !== groupId);
	}

	async function addGroups() {
		errorAlert?.hide();
		if (groupIdsToAdd.length === 0) {
			return true;
		}

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/auth/users/${user.id}/`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				new_group_ids: groupIdsToAdd
			})
		});

		if (response.ok) {
			const result = await response.json();
			user = { ...user, group_ids_names: result.group_ids_names };
			originalUser = deepCopy(nullifyEmptyStrings(user));
			groupIdsToAdd = [];
			return true;
		}

		errorAlert = displayStandardErrorAlert(
			await getAlertErrorFromResponse(response),
			'genericUserError'
		);
		return false;
	}

	/**
	 * @param {Response} response
	 */
	async function onSettingsUpdated(response) {
		const result = await response.json();
		settings = { ...result };
	}

	onMount(() => {
		originalUser = deepCopy(nullifyEmptyStrings(user));
		setGroupsSlimSelect();
	});

	function setGroupsSlimSelect() {
		const elementId = 'group-select';
		const selectElement = document.getElementById(elementId);
		selectElement?.classList.remove('invisible');
		groupsSelector = new SlimSelect({
			select: `#${elementId}`,
			settings: {
				showSearch: true,
				allowDeselect: true,
				ariaLabel: 'Select groups'
			},
			events: {
				afterChange: (selection) => {
					if (selection.length === 0 || selection[0].value === 'Select...') {
						selectedGroupsToAdd = [];
					} else {
						selectedGroupsToAdd = selection.map((o) => Number(o.value));
					}
				}
			}
		});
	}

	/**
	 * Updates SlimSelect options. This rebuilds the HTML elements and unset the selected value.
	 * @param {SlimSelect|undefined} select
	 * @param {Array<{ name: string, id: number|string }>} values
	 */
	export function setSlimSelectOptions(select, values) {
		if (!select) {
			return;
		}
		const options = values.map((p) => ({ text: p.name, value: p.id.toString() }));
		select.setData([{ text: 'Select...', placeholder: true }, ...options]);
	}
</script>

<div class="row">
	<div class="col-lg-7 needs-validation">
		{#if user.id}
			<div class="row mb-3">
				<label for="userId" class="col-sm-3 col-form-label text-end">
					<strong>Id</strong>
				</label>
				<div class="col-sm-9">
					<input type="text" readonly class="form-control-plaintext" id="userId" value={user.id} />
				</div>
			</div>
		{/if}
		<div class="row mb-3 has-validation">
			<label for="email" class="col-sm-3 col-form-label text-end">
				<strong>E-mail</strong>
			</label>
			<div class="col-sm-9">
				<input
					autocomplete="off"
					type="email"
					class="form-control"
					id="email"
					bind:value={user.email}
					class:is-invalid={userFormSubmitted && $userValidationErrors['email']}
					required
				/>
				<span class="invalid-feedback">{$userValidationErrors['email']}</span>
			</div>
		</div>
		{#if user.id && user.id !== $page.data.userInfo.id}
			<div class="row mb-3">
				<div class="col-sm-9 offset-sm-3">
					<div class="form-check">
						<input
							class="form-check-input"
							type="checkbox"
							id="active"
							bind:checked={user.is_active}
						/>
						<label class="form-check-label" for="active"> Active </label>
					</div>
				</div>
			</div>
			<div class="row mb-3">
				<div class="col-sm-9 offset-sm-3">
					<div class="form-check">
						<input
							class="form-check-input"
							type="checkbox"
							id="superuser"
							bind:checked={user.is_superuser}
						/>
						<label class="form-check-label" for="superuser"> Superuser </label>
					</div>
				</div>
			</div>
			<div class="row mb-3">
				<div class="col-sm-9 offset-sm-3">
					<div class="form-check">
						<input
							class="form-check-input"
							type="checkbox"
							id="verified"
							bind:checked={user.is_verified}
						/>
						<label class="form-check-label" for="verified"> Verified </label>
					</div>
				</div>
			</div>
		{/if}
		<div class="row mb-3 has-validation">
			<label for="password" class="col-sm-3 col-form-label text-end">
				<strong>Password</strong>
			</label>
			<div class="col-sm-9">
				<input
					type="password"
					autocomplete="new-password"
					class="form-control"
					id="password"
					bind:value={password}
					class:is-invalid={userFormSubmitted && $userValidationErrors['password']}
				/>
				<span class="form-text">Create a new password for this Fractal user</span>
				<span class="invalid-feedback">{$userValidationErrors['password']}</span>
			</div>
		</div>
		<div class="row mb-3 has-validation">
			<label for="confirmPassword" class="col-sm-3 col-form-label text-end">
				<strong>Confirm password</strong>
			</label>
			<div class="col-sm-9">
				<input
					type="password"
					class="form-control"
					id="confirmPassword"
					bind:value={confirmPassword}
					class:is-invalid={userFormSubmitted && $userValidationErrors['confirmPassword']}
				/>
				<span class="invalid-feedback">{$userValidationErrors['confirmPassword']}</span>
			</div>
		</div>
		<div class="row mb-3 has-validation">
			<label for="username" class="col-sm-3 col-form-label text-end">
				<strong>Username</strong>
			</label>
			<div class="col-sm-9">
				<input
					autocomplete="off"
					aria-autocomplete="none"
					type="text"
					class="form-control"
					id="username"
					class:is-invalid={userFormSubmitted && $userValidationErrors['username']}
					bind:value={user.username}
				/>
				<span class="form-text">
					Optional property (useful if the user creates their own tasks), not required if the SLURM
					user is set
				</span>
				<span class="invalid-feedback">{$userValidationErrors['username']}</span>
			</div>
		</div>
		{#if user.id}
			<div class="row mb-3 has-validation">
				<span class="col-sm-3 col-form-label text-end fw-bold">Groups</span>
				<div class="col-sm-9">
					<div>
						{#each userGroups as group}
							<span class="badge text-bg-light me-2 mb-2 fs-6 fw-normal">{group.name}</span>
						{/each}
						{#each groupsToAdd as groupToAdd}
							<span class="badge text-bg-light me-2 mb-2 fs-6 fw-normal">
								{groupToAdd.name}
								<button
									class="btn btn-link p-0 text-danger text-decoration-none remove-badge"
									type="button"
									aria-label="Remove group {groupToAdd.name}"
									on:click={() => removeGroupToAdd(groupToAdd.id)}
								>
									&times;
								</button>
							</span>
						{/each}
						{#if availableGroups.length > 0}
							<button class="btn btn-light" type="button" on:click={openAddGroupModal}>
								<i class="bi bi-plus-circle" />
								Add group
							</button>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<div class="row">
				<div class="col-sm-9 offset-sm-3">
					<div class="alert alert-info">User settings can be modified after creating the user</div>
				</div>
			</div>
		{/if}
	</div>

	{#if settings}
		<div class="row">
			<div class="mt-3 col-lg-7">
				<div class="row">
					<div class="offset-sm-3">
						<h4 class="fw-light">Settings</h4>
					</div>
				</div>
			</div>
		</div>
		<UserSettingsEditor
			bind:this={userSettingsEditor}
			bind:pendingChanges={settingsPendingChanges}
			{settings}
			{runnerBackend}
			settingsApiEndpoint="/api/auth/users/{user.id}/settings"
			{onSettingsUpdated}
		/>
	{/if}

	<div class="row">
		<div class="col-lg-7">
			<div class="row mb-3 mt-2">
				<div class="col-sm-9 offset-sm-3">
					<StandardDismissableAlert message={userUpdatedMessage} />
					<div id="genericUserError" />
					<button
						type="button"
						on:click={handleSave}
						class="btn btn-primary"
						disabled={!enableSave}
					>
						{#if saving}
							<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
						{/if}
						Save
					</button>
				</div>
			</div>
		</div>
	</div>

	<Modal
		id="confirmSuperuserChangeModal"
		bind:this={confirmSuperuserChange}
		size="md"
		centered={true}
	>
		<svelte:fragment slot="header">
			<h1 class="modal-title fs-5">Confirm action</h1>
		</svelte:fragment>
		<svelte:fragment slot="body">
			<p>
				Do you really want to
				<strong>{user.is_superuser ? 'grant' : 'revoke'}</strong>
				superuser privilege to this user?
			</p>
		</svelte:fragment>
		<svelte:fragment slot="footer">
			<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
			<button class="btn btn-primary" on:click={confirmSave}>Confirm</button>
		</svelte:fragment>
	</Modal>

	<Modal id="addGroupModal" centered={true} bind:this={addGroupModal} focus={false}>
		<svelte:fragment slot="header">
			<h1 class="modal-title fs-5">Add group</h1>
		</svelte:fragment>
		<svelte:fragment slot="body">
			<select id="group-select" class="invisible" class:border-danger={addGroupError} multiple />
			{#if addGroupError}
				<span class="text-danger">{addGroupError}</span>
			{/if}
			<div id="errorAlert-addGroupModal" class="mt-3" />
		</svelte:fragment>
		<svelte:fragment slot="footer">
			<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
			<button class="btn btn-primary" on:click={addGroupToUser}> Add </button>
		</svelte:fragment>
	</Modal>
</div>

<style>
	.remove-badge {
		line-height: 0;
	}
</style>
