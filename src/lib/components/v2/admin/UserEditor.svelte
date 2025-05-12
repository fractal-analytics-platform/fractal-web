<script>
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/state';
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
	import UserSettingsImportModal from './UserSettingsImportModal.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} user
	 * @property {Array<import('fractal-components/types/api').Group>} [groups]
	 * @property {import('fractal-components/types/api').UserSettings|null} [settings]
	 * @property {(user: import('fractal-components/types/api').User) => Promise<Response>} saveUser
	 * @property {string} runnerBackend
	 */

	/** @type {Props} */
	let {
		user = $bindable(),
		groups = [],
		settings = $bindable(null),
		saveUser,
		runnerBackend
	} = $props();

	/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}|undefined} */
	let editableUser = $state();

	$effect(() => {
		editableUser = deepCopy(user);
	});

	const currentUserId = $derived(page.data.userInfo?.id);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}|undefined} */
	let originalUser = $state();
	const userPendingChanges = $derived(
		editableUser &&
			JSON.stringify($state.snapshot(originalUser)) !==
				JSON.stringify(nullifyEmptyStrings($state.snapshot(editableUser)))
	);

	/** @type {import('$lib/components/v2/admin/UserSettingsEditor.svelte').default|undefined} */
	let userSettingsEditor = $state();
	let settingsPendingChanges = $state(false);

	/** @type {UserSettingsImportModal|undefined} */
	let userSettingsImportModal = $state();

	/** @type {Array<import('fractal-components/types/api').Group>} */
	let userGroups = $state([]);

	let password = $state('');
	let confirmPassword = $state('');

	let saving = $state(false);
	let userFormSubmitted = $state(false);

	let userUpdatedMessage = $state('');

	const userFormErrorHandler = new FormErrorHandler('genericUserError', [
		'email',
		'username',
		'password'
	]);

	const userValidationErrors = userFormErrorHandler.getValidationErrorStore();

	/** @type {Modal|undefined} */
	let confirmSuperuserChange = $state();

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
			if (editableUser?.is_superuser === originalUser?.is_superuser) {
				await confirmSave();
			} else {
				confirmSuperuserChange?.show();
			}
		} finally {
			saving = false;
		}
	}

	async function confirmSave() {
		if (!editableUser) {
			return;
		}
		saving = true;
		confirmSuperuserChange?.hide();
		try {
			let existing = !!editableUser.id;
			const groupsSuccess = await setGroups();
			if (!groupsSuccess) {
				return;
			}
			if (userPendingChanges || password) {
				if (password) {
					editableUser.password = password;
				}
				const response = await saveUser(editableUser);
				if (!response.ok) {
					await userFormErrorHandler.handleErrorResponse(response);
					return;
				}
				const result = await response.json();
				if (result.id === currentUserId) {
					// If the user modifies their own account the userInfo cached in the store has to be reloaded
					await invalidateAll();
				}
				password = '';
				confirmPassword = '';
				if (existing) {
					editableUser = { ...result };
					originalUser = deepCopy($state.snapshot(editableUser));
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
		if (!editableUser?.email) {
			userFormErrorHandler.addValidationError('email', 'Field is required');
		}
		validatePassword();
	}

	function validatePassword() {
		if (editableUser?.id && !password && !confirmPassword) {
			return;
		}
		if (!password) {
			userFormErrorHandler.addValidationError('password', 'Field is required');
		}
		if (password !== confirmPassword) {
			userFormErrorHandler.addValidationError('confirmPassword', "Passwords don't match");
		}
	}

	/** @type {Modal|undefined} */
	let addGroupModal = $state();
	/** @type {SlimSelect|undefined} */
	let groupsSelector;
	let addGroupError = $state('');
	/** @type {number[]} */
	let selectedGroupIdsToAdd = [];

	function openAddGroupModal() {
		selectedGroupIdsToAdd = [];
		addGroupError = '';
		if (!groupsSelector) {
			setGroupsSlimSelect();
		}
		const options = availableGroups.map((g) => ({ id: g.id, name: g.name }));
		setSlimSelectOptions(groupsSelector, options);
		addGroupModal?.show();
	}

	async function addGroupToUser() {
		addGroupError = '';
		if (selectedGroupIdsToAdd.length === 0) {
			addGroupError = 'Group is required';
			return;
		}

		const selectedGroupToAdd = selectedGroupIdsToAdd.map(
			(id) => groups.filter((g) => g.id === id)[0]
		);

		const newUserGroups = [...userGroups, ...selectedGroupToAdd];
		newUserGroups.sort(sortGroupByNameAllFirstComparator);

		userGroups = newUserGroups;
		selectedGroupIdsToAdd = [];
		addGroupModal?.hide();
	}

	/**
	 * @param {number} groupId
	 */
	function removeGroup(groupId) {
		const newUserGroups = userGroups.filter((g) => g.id !== groupId);
		newUserGroups.sort(sortGroupByNameAllFirstComparator);
		userGroups = newUserGroups;
	}

	async function setGroups() {
		if (!editableUser) {
			return;
		}

		errorAlert?.hide();
		if (addedGroups.length === 0 && removedGroups.length === 0) {
			return true;
		}

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/auth/users/${editableUser.id}/set-groups`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				group_ids: userGroups.map((g) => g.id)
			})
		});

		if (response.ok) {
			const result = await response.json();
			editableUser = { ...editableUser, group_ids_names: result.group_ids_names };
			originalUser = deepCopy(nullifyEmptyStrings($state.snapshot(editableUser)));
			loadUserGroups();
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
		originalUser = deepCopy(nullifyEmptyStrings($state.snapshot(editableUser)));
		loadUserGroups();
	});

	function loadUserGroups() {
		userGroups =
			editableUser?.group_ids_names
				.map((ni) => groups.filter((g) => g.id === ni[0])[0])
				.sort(sortGroupByNameAllFirstComparator) || [];
	}

	function setGroupsSlimSelect() {
		const elementId = 'group-select';
		const selectElement = document.getElementById(elementId);
		selectElement?.classList.remove('invisible');
		groupsSelector = new SlimSelect({
			select: `#${elementId}`,
			settings: {
				maxValuesShown: 5,
				showSearch: true,
				allowDeselect: true,
				ariaLabel: 'Select groups'
			},
			events: {
				afterChange: (selection) => {
					if (selection.length === 0 || selection[0].value === 'Select...') {
						selectedGroupIdsToAdd = [];
					} else {
						selectedGroupIdsToAdd = selection.map((o) => Number(o.value));
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

	/**
	 * @param {import('fractal-components/types/api').UserSettings} importedSettings
	 */
	function onSettingsImported(importedSettings) {
		settings = importedSettings;
	}
	let addedGroups = $derived(
		userGroups.filter((g) => !editableUser?.group_ids_names.map((ni) => ni[0]).includes(g.id))
	);
	let removedGroups = $derived(
		editableUser?.group_ids_names
			.map((ni) => ni[0])
			.filter((gi) => !userGroups.map((ug) => ug.id).includes(gi)) || []
	);
	let availableGroups = $derived(
		groups
			.filter((g) => !userGroups.map((ug) => ug.id).includes(g.id))
			.sort(sortGroupByNameAllFirstComparator)
	);

	let enableSave = $derived(
		!saving &&
			(userPendingChanges ||
				settingsPendingChanges ||
				addedGroups.length > 0 ||
				removedGroups.length > 0 ||
				password)
	);
</script>

{#if editableUser}
	<div class="row">
		<div class="col-lg-7 needs-validation">
			{#if editableUser.id}
				<div class="row mb-3">
					<label for="userId" class="col-sm-3 col-form-label text-end">
						<strong>Id</strong>
					</label>
					<div class="col-sm-9">
						<input
							type="text"
							readonly
							class="form-control-plaintext"
							id="userId"
							value={editableUser.id}
						/>
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
						bind:value={editableUser.email}
						class:is-invalid={userFormSubmitted && $userValidationErrors['email']}
						required
					/>
					<span class="invalid-feedback">{$userValidationErrors['email']}</span>
				</div>
			</div>
			{#if editableUser.id && editableUser.id !== currentUserId}
				<div class="row mb-3">
					<div class="col-sm-9 offset-sm-3">
						<div class="form-check">
							<input
								class="form-check-input"
								type="checkbox"
								id="active"
								bind:checked={editableUser.is_active}
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
								bind:checked={editableUser.is_superuser}
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
								bind:checked={editableUser.is_verified}
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
						bind:value={editableUser.username}
					/>
					<span class="form-text"> Optional property </span>
					<span class="invalid-feedback">{$userValidationErrors['username']}</span>
				</div>
			</div>
			{#if editableUser.id}
				<div class="row mb-3 has-validation">
					<span class="col-sm-3 col-form-label text-end fw-bold">Groups</span>
					<div class="col-sm-9">
						<div>
							{#each userGroups as group (group.id)}
								<span class="badge text-bg-light me-2 mb-2 fs-6 fw-normal">
									{group.name}
									{#if group.name !== 'All'}
										<button
											class="btn btn-link p-0 text-danger text-decoration-none remove-badge"
											type="button"
											aria-label="Remove group {group.name}"
											onclick={() => removeGroup(group.id)}
										>
											&times;
										</button>
									{/if}
								</span>
							{/each}
							{#if availableGroups.length > 0}
								<button class="btn btn-light" type="button" onclick={openAddGroupModal}>
									<i class="bi bi-plus-circle"></i>
									Add group
								</button>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<div class="row">
					<div class="col-sm-9 offset-sm-3">
						<div class="alert alert-info">
							User settings can be modified after creating the user
						</div>
					</div>
				</div>
			{/if}
		</div>

		{#if settings}
			<div class="row">
				<div class="mt-3 col-lg-7">
					<div class="row">
						<div class="col offset-sm-3">
							<button
								class="btn btn-primary float-end mb-2"
								onclick={() =>
									userSettingsImportModal?.open(
										userGroups.filter((g) => g.name !== 'All').map((g) => g.id)
									)}
							>
								Import from another user
							</button>
							<h4 class="fw-light mt-2">Settings</h4>
						</div>
					</div>
				</div>
			</div>
			<UserSettingsEditor
				bind:this={userSettingsEditor}
				bind:pendingChanges={settingsPendingChanges}
				{settings}
				{runnerBackend}
				settingsApiEndpoint="/api/auth/users/{editableUser.id}/settings"
				{onSettingsUpdated}
			/>
		{/if}

		<div class="row">
			<div class="col-lg-7">
				<div class="row mb-3 mt-2">
					<div class="col-sm-9 offset-sm-3">
						<StandardDismissableAlert message={userUpdatedMessage} />
						<div id="genericUserError"></div>
						<button
							type="button"
							onclick={handleSave}
							class="btn btn-primary"
							disabled={!enableSave}
						>
							{#if saving}
								<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
								></span>
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
			{#snippet header()}
				<h1 class="modal-title fs-5">Confirm action</h1>
			{/snippet}
			{#snippet body()}
				<p>
					Do you really want to
					<strong>{editableUser?.is_superuser ? 'grant' : 'revoke'}</strong>
					superuser privilege to this user?
				</p>
			{/snippet}
			{#snippet footer()}
				<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
				<button class="btn btn-primary" onclick={confirmSave}>Confirm</button>
			{/snippet}
		</Modal>

		<Modal id="addGroupModal" centered={true} bind:this={addGroupModal} focus={false}>
			{#snippet header()}
				<h1 class="modal-title fs-5">Add group</h1>
			{/snippet}
			{#snippet body()}
				<select id="group-select" class="invisible" class:border-danger={addGroupError} multiple
				></select>
				{#if addGroupError}
					<span class="text-danger">{addGroupError}</span>
				{/if}
				<div id="errorAlert-addGroupModal" class="mt-3"></div>
			{/snippet}
			{#snippet footer()}
				<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
				<button class="btn btn-primary" onclick={addGroupToUser}> Add </button>
			{/snippet}
		</Modal>

		<UserSettingsImportModal
			currentUserId={Number(editableUser.id)}
			bind:this={userSettingsImportModal}
			{onSettingsImported}
		/>
	</div>
{/if}

<style>
	.remove-badge {
		line-height: 0;
	}
</style>
