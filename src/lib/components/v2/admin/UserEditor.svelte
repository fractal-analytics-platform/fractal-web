<script>
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { nullifyEmptyStrings, removeNullValues } from '$lib/common/component_utilities';
	import { AlertError, displayStandardErrorAlert, FormErrorHandler } from '$lib/common/errors';
	import { onMount } from 'svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import { sortGroupByNameComparator } from '$lib/common/user_utilities';
	import SlimSelect from 'slim-select';
	import { stripNullAndEmptyObjectsAndArrays } from 'fractal-jschema';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';

	/** @type {import('$lib/types').User & {group_ids: number[]}} */
	export let user;
	/** @type {Array<import('$lib/types').Group>} */
	export let groups = [];
	/** @type {import('$lib/types').UserSettings|null} */
	export let settings = null;
	/** @type {(user: import('$lib/types').User) => Promise<Response>} */
	export let save;
	/** @type {string} */
	export let runnerBackend;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/** @type {number[]} */
	let groupIdsToAdd = [];

	$: userGroups = user.group_ids
		.map((id) => groups.filter((g) => g.id === id)[0])
		.sort(sortGroupByNameComparator);

	$: availableGroups = groups
		.filter((g) => !user.group_ids.includes(g.id))
		.filter((g) => !groupIdsToAdd.includes(g.id))
		.sort(sortGroupByNameComparator);

	$: groupsToAdd = groupIdsToAdd
		.map((id) => groups.filter((g) => g.id === id)[0])
		.sort(sortGroupByNameComparator);

	let password = '';
	let confirmPassword = '';

	let savingUser = false;
	let userFormSubmitted = false;

	let savingSettings = false;
	let settingsFormSubmitted = false;

	let userUpdatedMessage = '';
	let settingsUpdatedMessage = '';

	const userFormErrorHandler = new FormErrorHandler('genericUserError', [
		'email',
		'username',
		'password'
	]);

	const settingsFormErrorHandler = new FormErrorHandler('genericSettingsError', [
		'cache_dir',
		'slurm_accounts',
		'slurm_user',
		'ssh_host',
		'ssh_username',
		'ssh_private_key_path',
		'ssh_tasks_dir',
		'ssh_jobs_dir'
	]);

	const userValidationErrors = userFormErrorHandler.getValidationErrorStore();
	const settingsValidationErrors = settingsFormErrorHandler.getValidationErrorStore();

	/** @type {Modal} */
	let confirmSuperuserChange;
	let initialSuperuserValue = false;

	async function handleSaveUser() {
		savingUser = true;
		userUpdatedMessage = '';
		try {
			userFormSubmitted = true;
			userFormErrorHandler.clearErrors();
			validateUserFields();
			if (Object.keys($userValidationErrors).length > 0) {
				return;
			}
			if (user.is_superuser === initialSuperuserValue) {
				await confirmSaveUser();
			} else {
				savingUser = false;
				confirmSuperuserChange.show();
			}
		} finally {
			savingUser = false;
		}
	}

	async function confirmSaveUser() {
		savingUser = true;
		confirmSuperuserChange.hide();
		try {
			let existing = !!user.id;
			const groupsSuccess = await addGroups();
			if (!groupsSuccess) {
				return;
			}
			if (password) {
				user.password = password;
			}
			const userData = removeNullValues(nullifyEmptyStrings(user));
			const response = await save(userData);
			if (!response.ok) {
				await userFormErrorHandler.handleErrorResponse(response);
				return;
			}
			const result = await response.json();
			if (result.id === $page.data.userInfo.id) {
				// If the user modifies their own account the userInfo cached in the store has to be reloaded
				await invalidateAll();
			}
			if (existing) {
				user = { ...result };
				userUpdatedMessage = 'User successfully updated';
			} else {
				await goto(`/v2/admin/users/${result.id}/edit`);
			}
		} finally {
			savingUser = false;
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

	function addSlurmAccount() {
		if (!settings) {
			return;
		}
		settings.slurm_accounts = [...settings.slurm_accounts, ''];
	}

	/**
	 * @param {number} index
	 */
	function removeSlurmAccount(index) {
		if (!settings) {
			return;
		}
		settings.slurm_accounts = settings.slurm_accounts.filter((_, i) => i !== index);
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

		const result = await response.json();

		if (response.ok) {
			user = { ...user, group_ids: result.group_ids };
			groupIdsToAdd = [];
			return true;
		}

		errorAlert = displayStandardErrorAlert(
			new AlertError(result, response.status),
			'genericUserError'
		);
		return false;
	}

	async function handleSaveSettings() {
		savingSettings = true;
		settingsUpdatedMessage = '';
		try {
			settingsFormSubmitted = true;
			settingsFormErrorHandler.clearErrors();
			const headers = new Headers();
			headers.set('Content-Type', 'application/json');
			const response = await fetch(`/api/auth/users/${user.id}/settings`, {
				method: 'PATCH',
				credentials: 'include',
				headers,
				body: JSON.stringify({
					...stripNullAndEmptyObjectsAndArrays({ ...settings, id: undefined }),
					slurm_accounts: settings?.slurm_accounts
				})
			});
			if (!response.ok) {
				await settingsFormErrorHandler.handleErrorResponse(response);
				return;
			}
			const result = await response.json();
			settings = { ...result };
			settingsUpdatedMessage = 'Settings successfully updated';
		} finally {
			savingSettings = false;
		}
	}

	onMount(() => {
		initialSuperuserValue = user.is_superuser;
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

<div id="genericUserError" />

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
		<div class="row mb-3">
			<div class="col-sm-9 offset-sm-3">
				<StandardDismissableAlert message={userUpdatedMessage} />
				<button
					type="button"
					on:click={handleSaveUser}
					class="btn btn-primary"
					disabled={savingUser}
				>
					{#if savingUser}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
					{/if}
					Save
				</button>
			</div>
		</div>
	</div>

	{#if settings && runnerBackend !== 'local' && runnerBackend !== 'local_experimental'}
		<div id="genericSettingsError" />

		<div class="mt-3 col-lg-7 needs-validation">
			<div class="offset-sm-3">
				<h4 class="fw-light">Settings</h4>
			</div>
			{#if runnerBackend === 'slurm'}
				<div class="row mb-3 has-validation">
					<label for="slurmUser" class="col-sm-3 col-form-label text-end">
						<strong>SLURM user</strong>
					</label>
					<div class="col-sm-9">
						<input
							type="text"
							class="form-control"
							id="slurmUser"
							bind:value={settings.slurm_user}
							class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['slurm_user']}
						/>
						<div class="form-text">
							The user on the local SLURM cluster who will be impersonated by Fractal through
							<code>sudo -u</code>
						</div>
						<span class="invalid-feedback">{$settingsValidationErrors['slurm_user']}</span>
					</div>
				</div>
				<div class="row mb-3 has-validation">
					<label for="cacheDir" class="col-sm-3 col-form-label text-end">
						<strong>Cache dir</strong>
					</label>
					<div class="col-sm-9">
						<input
							type="text"
							class="form-control"
							id="cacheDir"
							bind:value={settings.cache_dir}
							class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['cache_dir']}
						/>
						<div class="form-text">
							Absolute path to a user-owned folder that will be used as a cache for job-related
							files
						</div>
						<span class="invalid-feedback">{$settingsValidationErrors['cache_dir']}</span>
					</div>
				</div>
			{:else if runnerBackend === 'slurm_ssh'}
				<div class="row mb-3 has-validation">
					<label for="sshHost" class="col-sm-3 col-form-label text-end">
						<strong>SSH host</strong>
					</label>
					<div class="col-sm-9">
						<input
							type="text"
							class="form-control"
							id="sshHost"
							bind:value={settings.ssh_host}
							class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['ssh_host']}
						/>
						<div class="form-text">SSH-reachable host where a SLURM client is available</div>
						<span class="invalid-feedback">{$settingsValidationErrors['ssh_host']}</span>
					</div>
				</div>
				<div class="row mb-3 has-validation">
					<label for="sshUsername" class="col-sm-3 col-form-label text-end">
						<strong>SSH username</strong>
					</label>
					<div class="col-sm-9">
						<input
							type="text"
							class="form-control"
							id="sshUsername"
							bind:value={settings.ssh_username}
							class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['ssh_username']}
						/>
						<div class="form-text">
							The user on the remote SLURM cluster who will be impersonated by Fractal through
							<code>ssh</code>
						</div>
						<span class="invalid-feedback">{$settingsValidationErrors['ssh_username']}</span>
					</div>
				</div>
				<div class="row mb-3 has-validation">
					<label for="sshPrivateKeyPath" class="col-sm-3 col-form-label text-end">
						<strong>SSH Private Key Path</strong>
					</label>
					<div class="col-sm-9">
						<input
							type="text"
							class="form-control"
							id="sshPrivateKeyPath"
							bind:value={settings.ssh_private_key_path}
							class:is-invalid={settingsFormSubmitted &&
								$settingsValidationErrors['ssh_private_key_path']}
						/>
						<div class="form-text">
							Path of private SSH key for <code>ssh_username</code>
						</div>
						<span class="invalid-feedback">{$settingsValidationErrors['ssh_private_key_path']}</span
						>
					</div>
				</div>
				<div class="row mb-3 has-validation">
					<label for="sshTasksDir" class="col-sm-3 col-form-label text-end">
						<strong>SSH Tasks Dir</strong>
					</label>
					<div class="col-sm-9">
						<input
							type="text"
							class="form-control"
							id="sshTasksDir"
							bind:value={settings.ssh_tasks_dir}
							class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['ssh_tasks_dir']}
						/>
						<div class="form-text">
							Task-venvs base folder on <code>ssh_host</code>
						</div>
						<span class="invalid-feedback">{$settingsValidationErrors['ssh_tasks_dir']}</span>
					</div>
				</div>
				<div class="row mb-3 has-validation">
					<label for="sshJobsDir" class="col-sm-3 col-form-label text-end">
						<strong>SSH Jobs Dir</strong>
					</label>
					<div class="col-sm-9">
						<input
							type="text"
							class="form-control"
							id="sshJobsDir"
							bind:value={settings.ssh_jobs_dir}
							class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['ssh_jobs_dir']}
						/>
						<div class="form-text">
							Jobs base folder on <code>ssh_host</code>
						</div>
						<span class="invalid-feedback">{$settingsValidationErrors['ssh_jobs_dir']}</span>
					</div>
				</div>
			{/if}
			<div class="row mb-3 has-validation">
				<label for="slurmAccount-0" class="col-sm-3 col-form-label text-end">
					<strong>SLURM accounts</strong>
				</label>
				<div class="col-sm-9 has-validation">
					{#each settings.slurm_accounts as slurmAccount, i}
						<div
							class="input-group mb-2"
							class:is-invalid={settingsFormSubmitted &&
								$settingsValidationErrors['slurm_accounts']}
						>
							<input
								type="text"
								class="form-control"
								id={`slurmAccount-${i}`}
								bind:value={slurmAccount}
								aria-label={`SLURM account #${i + 1}`}
								class:is-invalid={settingsFormSubmitted &&
									$settingsValidationErrors['slurm_accounts']}
								required
							/>
							<button
								class="btn btn-outline-secondary"
								type="button"
								id="slurm_account_remove_{i}"
								aria-label={`Remove SLURM account #${i + 1}`}
								on:click={() => removeSlurmAccount(i)}
							>
								<i class="bi bi-trash" />
							</button>
						</div>
					{/each}
					<span class="invalid-feedback mb-2">{$settingsValidationErrors['slurm_accounts']}</span>
					<button class="btn btn-light" type="button" on:click={addSlurmAccount}>
						<i class="bi bi-plus-circle" />
						Add SLURM account
					</button>
					<div class="form-text">
						The first account in the list will be used as a default for job execution.
					</div>
				</div>
			</div>
			<div class="row mb-3">
				<div class="col-sm-9 offset-sm-3">
					<StandardDismissableAlert message={settingsUpdatedMessage} />
					<button
						type="button"
						on:click={handleSaveSettings}
						class="btn btn-primary"
						disabled={savingSettings}
					>
						{#if savingSettings}
							<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
						{/if}
						Save
					</button>
				</div>
			</div>
		</div>
	{/if}

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
			<button class="btn btn-primary" on:click={confirmSaveUser}>Confirm</button>
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
