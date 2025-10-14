<script>
	import { goto } from '$app/navigation';
	import { FormErrorHandler } from '$lib/common/errors';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import { deepCopy } from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {Omit<import('fractal-components/types/api').Profile, 'id'>} profile
	 * @property {(user: import('fractal-components/types/api').Profile & { id: number | undefined }) => Promise<Response>} saveProfile
	 */

	/** @type {Props} */
	let { profile = $bindable(), saveProfile } = $props();

	/** @type {import('fractal-components/types/api').Profile | undefined} */
	let editableProfile = $state();
	let profileFormSubmitted = $state(false);
	let profileUpdatedMessage = $state('');
	let saving = $state(false);

	$effect(() => {
		editableProfile = deepCopy(profile);
	});

	const profileFormErrorHandler = new FormErrorHandler('genericProfileError', [
		'username',
		'ssh_key_path',
		'jobs_remote_dir',
		'tasks_remote_dir'
	]);

	const profileValidationErrors = profileFormErrorHandler.getValidationErrorStore();

	async function handleSave() {
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
			} else {
				await goto(`/v2/admin/resources/${profile.resource_id}/profiles`);
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
					<span class="invalid-feedback">{$profileValidationErrors['username']}</span>
				</div>
			</div>
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
					<span class="invalid-feedback">{$profileValidationErrors['ssh_key_path']}</span>
				</div>
			</div>
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
						class:is-invalid={profileFormSubmitted && $profileValidationErrors['tasks_remote_dir']}
						required
					/>
					<span class="invalid-feedback">{$profileValidationErrors['tasks_remote_dir']}</span>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-lg-7">
				<div class="row mb-3 mt-2">
					<div class="col-sm-9 offset-sm-3">
						<StandardDismissableAlert message={profileUpdatedMessage} />
						<div id="genericProfileError"></div>
						<button type="button" onclick={handleSave} class="btn btn-primary" disabled={saving}>
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
	</div>
{/if}
