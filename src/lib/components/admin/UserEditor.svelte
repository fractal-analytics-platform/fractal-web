<script>
	import { goto } from '$app/navigation';
	import { nullifyEmptyStrings, removeNullValues } from '$lib/common/component_utilities';
	import { displayStandardErrorAlert, getValidationMessagesMap } from '$lib/common/errors';

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

	async function handleSave() {
		saving = true;
		try {
			formSubmitted = true;
			genericErrorAlert?.hide();
			validateFields();
			if (Object.keys(validationErrors).length > 0) {
				return;
			}
			if (password) {
				user.password = password;
			}
			const userData = removeNullValues(nullifyEmptyStrings(user));
			const response = await save(userData);
			const result = await response.json();
			if (!response.ok) {
				const errorsMap = getValidationMessagesMap(result, response.status);
				if (errorsMap && validateErrorMapKeys(errorsMap)) {
					validationErrors = errorsMap;
				} else {
					genericErrorAlert = displayStandardErrorAlert(result, 'genericError');
				}
				return;
			}
			goto('/admin/users');
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

	/**
	 * @param {{[key:string]: string}} errorsMap
	 * @return {boolean}
	 */
	function validateErrorMapKeys(errorsMap) {
		const handledErrorKeys = ['email', 'username', 'slurm_user', 'cache_dir', 'password'];
		for (const key of Object.keys(errorsMap)) {
			if (!handledErrorKeys.includes(key)) {
				return false;
			}
		}
		return true;
	}
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
				<span class="invalid-feedback">{validationErrors['username']}</span>
			</div>
		</div>
		{#if user.id}
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
				<strong>Slurm user</strong>
			</label>
			<div class="col-sm-9">
				<input
					type="text"
					class="form-control"
					id="slurmUser"
					bind:value={user.slurm_user}
					class:is-invalid={formSubmitted && validationErrors['slurm_user']}
				/>
				<span class="invalid-feedback">{validationErrors['slurm_user']}</span>
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
				<span class="invalid-feedback">{validationErrors['cache_dir']}</span>
			</div>
		</div>
		<div class="row mb-3">
			<div class="col-sm-9 offset-sm-3">
				<input type="submit" value="Save" class="btn btn-primary" disabled={saving} />
			</div>
		</div>
	</form>
</div>
