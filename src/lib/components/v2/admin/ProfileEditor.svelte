<script>
	import { goto } from '$app/navigation';
	import { FormErrorHandler } from '$lib/common/errors';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import { deepCopy } from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').Profile | Omit<import('fractal-components/types/api').Profile, 'id'>} profile
	 * @property {import('fractal-components/types/api').Resource} resource
	 * @property {(user: import('fractal-components/types/api').Profile & { id: number | undefined }) => Promise<Response>} saveProfile
	 * @property {boolean} [showSaveButton]
	 */

	/** @type {Props} */
	let { profile = $bindable(), resource, saveProfile, showSaveButton = true } = $props();

	/** @type {import('fractal-components/types/api').Profile | undefined} */
	let editableProfile = $state();
	let profileFormSubmitted = $state(false);
	let profileUpdatedMessage = $state('');
	let saving = $state(false);

	$effect(() => {
		editableProfile = deepCopy(profile);
	});

	const profileFormErrorHandler = new FormErrorHandler(
		'genericProfileError',
		['name', 'username', 'ssh_key_path', 'jobs_remote_dir', 'tasks_remote_dir'],
		['body', resource.type]
	);

	const profileValidationErrors = profileFormErrorHandler.getValidationErrorStore();

	/**
	 * @returns {Promise<number | undefined>} the profile id, if successfully created
	 */
	export async function handleSave() {
		if (!editableProfile) {
			return;
		}

		saving = true;
		profileUpdatedMessage = '';
		profileFormErrorHandler.clearErrors();

		try {
			profileFormSubmitted = true;
			const response = await saveProfile(editableProfile);
			if (!response.ok) {
				await profileFormErrorHandler.handleErrorResponse(response);
				return;
			}
			if (editableProfile.id) {
				profileUpdatedMessage = 'Profile successfully updated';
			} else if (showSaveButton) {
				await goto(`/v2/admin/resources/${profile.resource_id}/profiles`);
			} else {
				const { id } = await response.json();
				return id;
			}
		} finally {
			saving = false;
		}
	}
</script>

{#if editableProfile}
	<div class="row">
		<div class="col-lg-7 needs-validation">
			{#if editableProfile.id}
				<div class="row mb-3">
					<label for="profileId" class="col-sm-3 col-form-label text-end">
						<strong>Id</strong>
					</label>
					<div class="col-sm-9">
						<input
							type="text"
							readonly
							class="form-control-plaintext"
							id="profileId"
							value={editableProfile.id}
						/>
					</div>
				</div>
			{/if}
			<div class="row mb-3 has-validation">
				<label for="name" class="col-sm-3 col-form-label text-end">
					<strong>Profile name</strong>
				</label>
				<div class="col-sm-9">
					<input
						autocomplete="off"
						type="text"
						class="form-control"
						id="name"
						bind:value={editableProfile.name}
						class:is-invalid={profileFormSubmitted && $profileValidationErrors['name']}
						required
					/>
					<span class="invalid-feedback">{$profileValidationErrors['name']}</span>
				</div>
			</div>
			{#if resource.type === 'slurm_sudo' || resource.type === 'slurm_ssh'}
				<div class="row mb-3 has-validation">
					<label for="username" class="col-sm-3 col-form-label text-end">
						<strong>Username</strong>
					</label>
					<div class="col-sm-9">
						<input
							autocomplete="off"
							type="text"
							class="form-control"
							id="username"
							bind:value={editableProfile.username}
							class:is-invalid={profileFormSubmitted && $profileValidationErrors['username']}
							required
						/>
						{#if resource.type === 'slurm_sudo'}
							<div class="form-text">
								The user on the local SLURM cluster who will be impersonated by Fractal through
								<code>sudo -u</code>
							</div>
						{:else}
							<div class="form-text">
								The user on the remote SLURM cluster who will be impersonated by Fractal through
								<code>ssh</code>
							</div>
						{/if}
						<span class="invalid-feedback">{$profileValidationErrors['username']}</span>
					</div>
				</div>
			{/if}
			{#if resource.type === 'slurm_ssh'}
				<div class="row mb-3 has-validation">
					<label for="ssh_key_path" class="col-sm-3 col-form-label text-end">
						<strong>SSH key path</strong>
					</label>
					<div class="col-sm-9">
						<input
							autocomplete="off"
							type="text"
							class="form-control"
							id="ssh_key_path"
							bind:value={editableProfile.ssh_key_path}
							class:is-invalid={profileFormSubmitted && $profileValidationErrors['ssh_key_path']}
							required
						/>
						<div class="form-text">
							Path of private SSH key for <code>username</code>
						</div>
						<span class="invalid-feedback">{$profileValidationErrors['ssh_key_path']}</span>
					</div>
				</div>
			{/if}
			{#if resource.type === 'slurm_ssh'}
				<div class="row mb-3 has-validation">
					<label for="jobs_remote_dir" class="col-sm-3 col-form-label text-end">
						<strong>Jobs remote dir</strong>
					</label>
					<div class="col-sm-9">
						<input
							autocomplete="off"
							type="text"
							class="form-control"
							id="jobs_remote_dir"
							bind:value={editableProfile.jobs_remote_dir}
							class:is-invalid={profileFormSubmitted && $profileValidationErrors['jobs_remote_dir']}
							required
						/>
						<span class="invalid-feedback">{$profileValidationErrors['jobs_remote_dir']}</span>
					</div>
				</div>
			{/if}
			{#if resource.type === 'slurm_ssh'}
				<div class="row mb-3 has-validation">
					<label for="tasks_remote_dir" class="col-sm-3 col-form-label text-end">
						<strong>Tasks remote dir</strong>
					</label>
					<div class="col-sm-9">
						<input
							autocomplete="off"
							type="text"
							class="form-control"
							id="tasks_remote_dir"
							bind:value={editableProfile.tasks_remote_dir}
							class:is-invalid={profileFormSubmitted &&
								$profileValidationErrors['tasks_remote_dir']}
							required
						/>
						<span class="invalid-feedback">{$profileValidationErrors['tasks_remote_dir']}</span>
					</div>
				</div>
			{/if}
		</div>
		<div class="row">
			<div class="col-lg-7">
				<div class="row mb-3 mt-2">
					<div class="col-sm-9 offset-sm-3">
						<StandardDismissableAlert message={profileUpdatedMessage} />
						<div id="genericProfileError"></div>
						{#if showSaveButton}
							<button type="button" onclick={handleSave} class="btn btn-primary" disabled={saving}>
								{#if saving}
									<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true">
									</span>
								{/if}
								Save
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
