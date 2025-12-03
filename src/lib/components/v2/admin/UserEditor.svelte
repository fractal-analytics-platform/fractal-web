<script>
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		displayStandardErrorAlert,
		FormErrorHandler,
		getAlertErrorFromResponse
	} from '$lib/common/errors';
	import { onMount } from 'svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import { getSortGroupByNameAllFirstComparator } from '$lib/components/admin/user_utilities.js';
	import SlimSelect from 'slim-select';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import { deepCopy, normalizePayload, nullifyEmptyStrings } from 'fractal-components';
	import ProfileEditor from './ProfileEditor.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} user
	 * @property {Array<import('fractal-components/types/api').Group>} [groups]
	 * @property {(user: import('fractal-components/types/api').User) => Promise<Response>} saveUser
	 * @property {string} runnerBackend
	 * @property {string|null} defaultGroupName
	 */

	/** @type {Props} */
	let { user = $bindable(), groups = [], saveUser, runnerBackend, defaultGroupName } = $props();

	/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}|undefined} */
	let editableUser = $state();

	$effect(() => {
		editableUser = deepCopy(user);
	});

	const currentUserId = $derived(page.data.userInfo?.id);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let profilesErrorAlert = undefined;

	/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}|undefined} */
	let originalUser = $state();
	const userPendingChanges = $derived(
		editableUser &&
			JSON.stringify($state.snapshot(originalUser)) !==
				JSON.stringify(nullifyEmptyStrings($state.snapshot(editableUser)))
	);

	/** @type {Array<import('fractal-components/types/api').Group>} */
	let userGroups = $state([]);

	let password = $state('');
	let confirmPassword = $state('');

	/** @type {Array<import('fractal-components/types/api').Resource>} */
	let resources = $state([]);
	/** @type {number|undefined} */
	let selectedResourceId = $state();
	/** @type {import('fractal-components/types/api').Resource|undefined} */
	let selectedResource = $state();

	/** @type {'create_new'|'use_existing'} */
	let profileOption = $state('use_existing');
	/** @type {Array<import('fractal-components/types/api').Profile>} */
	let profiles = $state([]);
	/** @type {Omit<import('fractal-components/types/api').Profile, 'id'>|undefined} */
	let newProfile = $state();
	/** @type {import('$lib/components/v2/admin/ProfileEditor.svelte').default|undefined} */
	let profileEditor = $state();

	let saving = $state(false);
	let userFormSubmitted = $state(false);

	let userUpdatedMessage = $state('');

	const userFormErrorHandler = new FormErrorHandler('genericUserError', [
		'email',
		'password',
		'project_dirs',
		'slurm_accounts'
	]);

	const userValidationErrors = userFormErrorHandler.getValidationErrorStore();

	/** @type {Modal|undefined} */
	let confirmSuperuserChange = $state();

	const showCreateProfile = $derived(editableUser && !editableUser.id);

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
				if (showCreateProfile && profileOption === 'create_new' && profileEditor) {
					const newProfileId = await profileEditor.handleSave();
					if (!newProfileId) {
						return;
					}
					editableUser.profile_id = newProfileId;
				}

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
		newUserGroups.sort(getSortGroupByNameAllFirstComparator(defaultGroupName));

		userGroups = newUserGroups;
		selectedGroupIdsToAdd = [];
		addGroupModal?.hide();
	}

	/**
	 * @param {number} groupId
	 */
	function removeGroup(groupId) {
		const newUserGroups = userGroups.filter((g) => g.id !== groupId);
		newUserGroups.sort(getSortGroupByNameAllFirstComparator(defaultGroupName));
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
			body: normalizePayload({
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

	onMount(async () => {
		originalUser = deepCopy(nullifyEmptyStrings($state.snapshot(editableUser)));
		loadUserGroups();
		await initProfile();
		await loadResources(false);
		const autoselectProfile = editableUser && !editableUser.id && runnerBackend === 'local';
		if (autoselectProfile && resources.length > 0) {
			selectedResourceId = resources[0].id;
			selectedResource = resources[0];
			await resourceChanged();
		}
		if (selectedResourceId) {
			await loadProfiles(false);
		}
		if (editableUser && autoselectProfile && profiles.length > 0) {
			editableUser.profile_id = profiles[0].id;
		}
	});

	function loadUserGroups() {
		userGroups =
			editableUser?.group_ids_names
				.map((ni) => groups.filter((g) => g.id === ni[0])[0])
				.sort(getSortGroupByNameAllFirstComparator(defaultGroupName)) || [];
	}

	async function initProfile() {
		if (!editableUser || editableUser.profile_id === null) {
			return;
		}
		const response = await fetch(`/api/admin/v2/profile/${editableUser.profile_id}`);
		if (response.ok) {
			/** @type {import('fractal-components/types/api').Profile} */
			const profile = await response.json();
			selectedResourceId = profile.resource_id;
		} else {
			profilesErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'errorAlert-profiles'
			);
		}
	}

	async function loadResources(hideOldError = true) {
		profiles = [];
		if (hideOldError) {
			profilesErrorAlert?.hide();
		}
		const response = await fetch(`/api/admin/v2/resource`);
		if (response.ok) {
			resources = await response.json();
		} else {
			profilesErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'errorAlert-profiles'
			);
		}
	}

	async function resourceChanged() {
		if (editableUser) {
			editableUser.profile_id = null;
		}

		if (showCreateProfile) {
			await loadResource();
			if (selectedResource) {
				newProfile = {
					resource_id: selectedResource.id,
					resource_type: selectedResource.type,
					name: '',
					jobs_remote_dir: '',
					ssh_key_path: '',
					tasks_remote_dir: '',
					username: ''
				};
			}
		}
		await loadProfiles();
	}

	async function loadResource() {
		if (!selectedResourceId) {
			selectedResource = undefined;
			return;
		}
		const response = await fetch(`/api/admin/v2/resource/${selectedResourceId}`);
		if (response.ok) {
			selectedResource = await response.json();
		} else {
			profilesErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'errorAlert-profiles'
			);
		}
	}

	/**
	 * @param {Omit<import('fractal-components/types/api').Profile, 'id'>} profile
	 */
	async function createProfile(profile) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		return await fetch(`/api/admin/v2/resource/${selectedResourceId}/profile`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: normalizePayload({ ...profile, resource_id: undefined }, { nullifyEmptyStrings: true })
		});
	}

	async function loadProfiles(hideOldError = true) {
		if (selectedResourceId === undefined) {
			return;
		}
		if (hideOldError) {
			profilesErrorAlert?.hide();
		}
		const response = await fetch(`/api/admin/v2/resource/${selectedResourceId}/profile`);
		if (response.ok) {
			profiles = await response.json();
		} else {
			profilesErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'errorAlert-profiles'
			);
		}
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

	function addSlurmAccount() {
		if (editableUser) {
			editableUser.slurm_accounts = [...editableUser.slurm_accounts, ''];
		}
	}

	/**
	 * @param {number} index
	 */
	function removeSlurmAccount(index) {
		if (editableUser) {
			editableUser.slurm_accounts = editableUser.slurm_accounts.filter((_, i) => i !== index);
		}
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
			.sort(getSortGroupByNameAllFirstComparator(defaultGroupName))
	);

	let enableSave = $derived(
		!saving &&
			(userPendingChanges || addedGroups.length > 0 || removedGroups.length > 0 || password)
	);

	function addProjectDir() {
		if (!editableUser) {
			return;
		}
		editableUser.project_dirs = [...editableUser.project_dirs, ''];
	}

	/**
	 * @param {number} index
	 */
	function removeProjectDir(index) {
		if (!editableUser) {
			return;
		}
		editableUser.project_dirs = editableUser.project_dirs.filter((_, i) => i !== index);
		userFormErrorHandler.removeValidationError('project_dirs', index);
	}

	/**
	 * @param {string | string[]} error
	 * @param {number} index
	 */
	function getProjectDirError(error, index) {
		if (typeof error === 'string') {
			return error;
		}
		if (Array.isArray(error) && error[index]) {
			return error[index];
		}
		return undefined;
	}
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
				<label for="profile" class="col-sm-3 col-form-label text-end">
					<strong>Profile</strong>
				</label>
				<div class="col-sm-9">
					{#if showCreateProfile}
						<div class="row mb-1">
							<div class="col">
								<div class="form-check form-check-inline">
									<input
										class="form-check-input"
										type="radio"
										name="profileOptions"
										id="use_existing"
										value="use_existing"
										bind:group={profileOption}
									/>
									<label class="form-check-label" for="use_existing">Use existing</label>
								</div>
								<div class="form-check form-check-inline">
									<input
										class="form-check-input"
										type="radio"
										name="profileOptions"
										id="create_new"
										value="create_new"
										bind:group={profileOption}
									/>
									<label class="form-check-label" for="create_new">Create new</label>
								</div>
							</div>
						</div>
					{/if}

					<div class="row">
						<div class="col-lg-6">
							<select
								class="form-select"
								bind:value={selectedResourceId}
								onchange={resourceChanged}
								aria-label="Select resource"
							>
								<option value={undefined}>Select resource...</option>
								{#each resources as resource (resource.id)}
									<option value={resource.id}>{resource.name}</option>
								{/each}
							</select>
						</div>
						{#if profileOption === 'use_existing'}
							<div class="col-lg-6">
								<select
									class="form-select"
									bind:value={editableUser.profile_id}
									class:is-invalid={userFormSubmitted && $userValidationErrors['profile_id']}
									disabled={selectedResourceId === undefined}
									aria-label="Select profile"
								>
									<option value={null}>Select profile...</option>
									{#each profiles as profile (profile.id)}
										<option value={profile.id}>{profile.name}</option>
									{/each}
								</select>
								<span class="invalid-feedback">{$userValidationErrors['profile_id']}</span>
							</div>
						{/if}
					</div>
					<div class="row">
						<div class="col">
							<div id="errorAlert-profiles" class="mt-2 mb-0"></div>
						</div>
					</div>
				</div>
			</div>

			<div class="row mb-3 has-validation">
				<span class="col-sm-3 col-form-label text-end">
					<strong>Project dirs</strong>
				</span>
				<div class="col-sm-9">
					<!-- eslint-disable-next-line no-unused-vars -->
					{#each editableUser.project_dirs as _, i (i)}
						<div class="input-group mb-2 has-validation">
							<input
								type="text"
								class="form-control"
								id="project_dir_{i}"
								aria-label="Project dir"
								bind:value={editableUser.project_dirs[i]}
								class:is-invalid={userFormSubmitted &&
									getProjectDirError($userValidationErrors['project_dirs'], i)}
							/>
							{#if editableUser.project_dirs.length > 1}
								<button
									class="btn btn-outline-secondary"
									type="button"
									aria-label="Remove project dir"
									onclick={() => removeProjectDir(i)}
								>
									<i class="bi bi-trash"></i>
								</button>
							{/if}
							{#if getProjectDirError($userValidationErrors['project_dirs'], i)}
								<span class="invalid-feedback">
									{getProjectDirError($userValidationErrors['project_dirs'], i)}
								</span>
							{/if}
						</div>
					{/each}
					<span class="form-text">
						Base folders used for default <code>zarr_dir</code> paths
					</span>
					<div>
						<button type="button" class="btn btn-outline-secondary mt-2" onclick={addProjectDir}>
							Add project dir
						</button>
					</div>
				</div>
			</div>

			{#if runnerBackend !== 'local'}
				<div class="row mb-3 has-validation">
					<label for="slurmAccount-0" class="col-sm-3 col-form-label text-end">
						<strong>SLURM accounts</strong>
					</label>
					<div class="col-sm-9 has-validation">
						<!-- eslint-disable-next-line no-unused-vars -->
						{#each editableUser.slurm_accounts as _, i (i)}
							<div
								class="input-group mb-2"
								class:is-invalid={userFormSubmitted && $userValidationErrors['slurm_accounts']}
							>
								<input
									type="text"
									class="form-control"
									id={`slurmAccount-${i}`}
									bind:value={editableUser.slurm_accounts[i]}
									aria-label={`SLURM account #${i + 1}`}
									class:is-invalid={userFormSubmitted && $userValidationErrors['slurm_accounts']}
									required
								/>
								<button
									class="btn btn-outline-secondary"
									type="button"
									id="slurm_account_remove_{i}"
									aria-label={`Remove SLURM account #${i + 1}`}
									onclick={() => removeSlurmAccount(i)}
								>
									<i class="bi bi-trash"></i>
								</button>
							</div>
						{/each}
						<span class="invalid-feedback mb-2"
							>{userFormSubmitted && $userValidationErrors['slurm_accounts']}</span
						>
						<button class="btn btn-light" type="button" onclick={addSlurmAccount}>
							<i class="bi bi-plus-circle"></i>
							Add SLURM account
						</button>
						<div class="form-text">
							The first account in the list will be used as a default for job execution.
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
	{#if showCreateProfile && profileOption === 'create_new' && selectedResource && newProfile}
		<ProfileEditor
			profile={newProfile}
			resource={selectedResource}
			saveProfile={createProfile}
			showSaveButton={false}
			bind:this={profileEditor}
		/>
	{/if}
	<div class="row">
		<div class="col-lg-7 needs-validation">
			{#if editableUser.id}
				<div class="row mb-3 has-validation">
					<span class="col-sm-3 col-form-label text-end fw-bold">Groups</span>
					<div class="col-sm-9">
						<div>
							{#each userGroups as group (group.id)}
								<span class="badge text-bg-light me-2 mb-2 fs-6 fw-normal">
									{group.name}
									{#if group.name !== defaultGroupName}
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
						<div class="alert alert-info">User groups can be modified after creating the user</div>
					</div>
				</div>
			{/if}
		</div>

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
								<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true">
								</span>
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
	</div>
{/if}

<style>
	.remove-badge {
		line-height: 0;
	}
</style>
