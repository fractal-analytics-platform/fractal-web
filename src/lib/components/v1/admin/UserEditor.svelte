<script>
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { nullifyEmptyStrings, removeNullValues } from '$lib/common/component_utilities';
	import {
		displayStandardErrorAlert,
		getValidationMessagesMap,
		validateErrorMapKeys
	} from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import { onMount } from 'svelte';

	/** @type {import('$lib/types').User} */
	export let user;
	/** @type {(user: import('$lib/types').User) => Promise<Response>} */
	export let save;

	let password = '';
	let confirmPassword = '';

	let saving = false;
	let formSubmitted = false;
	let validationErrors = {};
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let genericErrorAlert = undefined;

	/** @type {Modal} */
	let confirmSuperuserChange;
	let initialSuperuserValue = false;

	/**
	 * @param {SubmitEvent} event
	 */
	async function handleSave(event) {
		saving = true;
		try {
			formSubmitted = true;
			genericErrorAlert?.hide();
			validateFields();
			if (Object.keys(validationErrors).length > 0) {
				return;
			}
			if (user.is_superuser === initialSuperuserValue) {
				await confirmSave();
			} else {
				saving = false;
				event.preventDefault();
				confirmSuperuserChange.show();
			}
		} finally {
			saving = false;
		}
	}

	const handledErrorKeys = [
		'email',
		'username',
		'slurm_user',
		'cache_dir',
		'password',
		'slurm_accounts'
	];

	async function confirmSave() {
		saving = true;
		try {
			if (password) {
				user.password = password;
			}
			const userData = removeNullValues(nullifyEmptyStrings(user));
			const response = await save(userData);
			const result = await response.json();
			if (!response.ok) {
				const errorsMap = getValidationMessagesMap(result, response.status);
				if (errorsMap && validateErrorMapKeys(errorsMap, handledErrorKeys)) {
					validationErrors = errorsMap;
				} else {
					genericErrorAlert = displayStandardErrorAlert(result, 'genericError');
				}
				return;
			}
			if (result.id === $page.data.userInfo.id) {
				// If the user modifies their own account the userInfo cached in the store has to be reloaded
				await invalidateAll();
			}
			await goto('/v1/admin/users');
		} finally {
			saving = false;
		}
	}

	function validateFields() {
		validationErrors = {};
		if (!user.email) {
			addValidationError('email', 'Field is required');
		}
		validatePassword();
	}

	function validatePassword() {
		if (user.id && !password && !confirmPassword) {
			return;
		}
		if (!password) {
			addValidationError('password', 'Field is required');
		}
		if (password !== confirmPassword) {
			addValidationError('confirmPassword', "Passwords don't match");
		}
	}

	/**
	 * @param {string} key
	 * @param {string} value
	 */
	function addValidationError(key, value) {
		validationErrors = { ...validationErrors, [key]: value };
	}

	function addSlurmAccount() {
		user.slurm_accounts = [...user.slurm_accounts, ''];
	}

	/**
	 * @param {number} index
	 */
	function removeSlurmAccount(index) {
		user.slurm_accounts = user.slurm_accounts.filter((_, i) => i !== index);
	}

	onMount(() => {
		initialSuperuserValue = user.is_superuser;
	});
</script>

<div id="genericError" />

<div class="row">
	<form class="col-lg-7 needs-validation" novalidate on:submit={handleSave}>
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
					class:is-invalid={formSubmitted && validationErrors['email']}
					required
				/>
				<span class="invalid-feedback">{validationErrors['email']}</span>
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
					class:is-invalid={formSubmitted && validationErrors['password']}
				/>
				<span class="form-text">Create a new password for this Fractal user</span>
				<span class="invalid-feedback">{validationErrors['password']}</span>
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
					class:is-invalid={formSubmitted && validationErrors['confirmPassword']}
				/>
				<span class="invalid-feedback">{validationErrors['confirmPassword']}</span>
			</div>
		</div>
		<div class="row mb-3 has-validation">
			<label for="slurmUser" class="col-sm-3 col-form-label text-end">
				<strong>SLURM user</strong>
			</label>
			<div class="col-sm-9">
				<input
					type="text"
					class="form-control"
					id="slurmUser"
					bind:value={user.slurm_user}
					class:is-invalid={formSubmitted && validationErrors['slurm_user']}
				/>
				<div class="form-text">
					The user who will be impersonated by Fractal when running SLURM jobs
				</div>
				<span class="invalid-feedback">{validationErrors['slurm_user']}</span>
			</div>
		</div>
		<div class="row mb-3 has-validation">
			<label for="slurmAccount-0" class="col-sm-3 col-form-label text-end">
				<strong>SLURM accounts</strong>
			</label>
			<div class="col-sm-9 has-validation">
				{#each user.slurm_accounts as slurmAccount, i}
					<div
						class="input-group mb-2"
						class:is-invalid={formSubmitted && validationErrors['slurm_accounts']}
					>
						<input
							type="text"
							class="form-control"
							id={`slurmAccount-${i}`}
							bind:value={slurmAccount}
							aria-label={`SLURM account #${i + 1}`}
							class:is-invalid={formSubmitted && validationErrors['slurm_accounts']}
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
				<span class="invalid-feedback mb-2">{validationErrors['slurm_accounts']}</span>
				<button class="btn btn-light" type="button" on:click={addSlurmAccount}>
					<i class="bi bi-plus-circle" />
					Add SLURM account
				</button>
				<div class="form-text">
					The first account in the list will be used as a default for job execution.
				</div>
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
					class:is-invalid={formSubmitted && validationErrors['username']}
					bind:value={user.username}
				/>
				<span class="form-text">
					Optional property (useful if the user creates their own tasks), not required if the SLURM
					user is set
				</span>
				<span class="invalid-feedback">{validationErrors['username']}</span>
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
					bind:value={user.cache_dir}
					class:is-invalid={formSubmitted && validationErrors['cache_dir']}
				/>
				<div class="form-text">
					Absolute path to a user-owned folder that will be used as a cache for job-related files
				</div>
				<span class="invalid-feedback">{validationErrors['cache_dir']}</span>
			</div>
		</div>
		<div class="row mb-3">
			<div class="col-sm-9 offset-sm-3">
				<input type="submit" value="Save" class="btn btn-primary" disabled={saving} />
			</div>
		</div>
	</form>

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
</div>
