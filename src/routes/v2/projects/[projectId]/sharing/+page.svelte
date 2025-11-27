<script>
	import { page } from '$app/state';
	import { FormErrorHandler, getAlertErrorFromResponse } from '$lib/common/errors';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import { normalizePayload } from 'fractal-components';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';

	/** @type {import('fractal-components/types/api').ProjectV2} */
	let project = $state(page.data.project);
	/** @type {import('fractal-components/types/api').ProjectGuest[]} */
	let guests = $state(page.data.guests);

	let email = $state('');
	let permissions = $state('');
	let sharing = $state(false);

	const shareFormErrorHandler = new FormErrorHandler('genericShareError', ['email', 'permissions']);
	const shareValidationErrors = shareFormErrorHandler.getValidationErrorStore();

	async function handleShareProject() {
		sharing = true;
		shareFormErrorHandler.clearErrors();

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(
			`/api/v2/project/${project.id}/guest/?email=${encodeURIComponent(email)}`,
			{
				method: 'POST',
				headers,
				body: normalizePayload({ permissions })
			}
		);
		sharing = false;

		if (response.ok) {
			guests.push({ email, is_verified: false, permissions });
			email = '';
			permissions = '';
		} else {
			await shareFormErrorHandler.handleErrorResponse(response);
		}
	}

	let sortedGuests = $derived([...guests].sort((g1, g2) => g1.email.localeCompare(g2.email)));

	/** @type {import('fractal-components/types/api').ProjectGuest|undefined} */
	let guestToEdit = $state();
	/** @type {Modal|undefined} */
	let editGuestModal = $state();
	/** @type {string|undefined} */
	let permissionsToEdit = $state();
	let saving = $state(false);

	/**
	 * @param {import('fractal-components/types/api').ProjectGuest} guest
	 */
	function openeditGuestModal(guest) {
		guestToEdit = guest;
		permissionsToEdit = guest.permissions;
		editGuestModal?.show();
	}

	async function confirmEditGuest() {
		editGuestModal?.confirmAndHide(async function () {
			const email = guestToEdit?.email || '';

			saving = true;

			const headers = new Headers();
			headers.set('Content-Type', 'application/json');

			const response = await fetch(
				`/api/v2/project/${project.id}/guest/?email=${encodeURIComponent(email)}`,
				{
					method: 'PATCH',
					headers,
					body: normalizePayload({ permissions: permissionsToEdit })
				}
			);

			saving = false;

			if (response.ok) {
				guests = guests.map((g) =>
					g.email === guestToEdit?.email
						? { ...g, permissions: /**@type {string} */ (permissionsToEdit) }
						: g
				);
			} else {
				throw await getAlertErrorFromResponse(response);
			}
		});
	}

	/**
	 * @param {string} email
	 */
	async function handleDeleteGuest(email) {
		const response = await fetch(
			`/api/v2/project/${project.id}/guest/?email=${encodeURIComponent(email)}`,
			{
				method: 'DELETE'
			}
		);
		if (response.ok) {
			guests = guests.filter((g) => g.email !== email);
		} else {
			throw await getAlertErrorFromResponse(response);
		}
	}
</script>

<div class="container my-3">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item" aria-current="page">
				<a href="/v2/projects">Projects</a>
			</li>
			{#if page.params.projectId}
				<li class="breadcrumb-item" aria-current="page">
					<a href="/v2/projects/{page.params.projectId}">{project.name}</a>
				</li>
			{/if}
			<li class="breadcrumb-item active">Sharing options</li>
		</ol>
	</nav>
</div>

<div class="container mt-4">
	<div class="row">
		<div class="col">
			<h3 class="fw-light">Guests</h3>

			{#if guests.length === 0}
				<p>This project has not been shared with anyone yet.</p>
			{:else}
				<table class="table mt-3">
					<thead>
						<tr>
							<th>E-mail</th>
							<th>Verified</th>
							<th>Read</th>
							<th>Write</th>
							<th>Execute</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each sortedGuests as guest (guest.email)}
							<tr class="align-middle">
								<td>{guest.email}</td>
								<td>
									<BooleanIcon value={guest.is_verified} />
								</td>
								<td>
									<BooleanIcon value={true} />
								</td>
								<td>
									<BooleanIcon value={guest.permissions.startsWith('rw')} />
								</td>
								<td>
									<BooleanIcon value={guest.permissions === 'rwx'} />
								</td>
								<td>
									<button
										type="button"
										class="btn btn-primary"
										onclick={() => openeditGuestModal(guest)}
									>
										<i class="bi bi-pencil"></i>
										Edit
									</button>
									<ConfirmActionButton
										modalId="confirmDeleteGuestModal{guest.email.replaceAll(/[^\w]/g, '')}"
										style="danger"
										btnStyle="danger"
										buttonIcon="trash"
										label="Delete"
										message={`Delete guest ${guest.email}`}
										callbackAction={() => handleDeleteGuest(guest.email)}
									/>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</div>
	<div class="row mt-4">
		<div class="col-lg-6 col-xl-5">
			<h3 class="fw-light">Invite users</h3>
			<form
				class="row"
				onsubmit={(e) => {
					e.preventDefault();
					handleShareProject();
				}}
				id="share-project-form"
			>
				<div class="row mb-2">
					<label for="user-email" class="col-md-3 col-form-label">User e-mail</label>
					<div class="col-md-9">
						<input
							id="user-email"
							type="email"
							bind:value={email}
							class="form-control"
							class:is-invalid={$shareValidationErrors['email']}
							required
						/>
						{#if $shareValidationErrors['email']}
							<div class="invalid-feedback">{$shareValidationErrors['email']}</div>
						{/if}
					</div>
				</div>
				<div class="row mb-2">
					<label for="permissions" class="col-md-3 col-form-label">Permissions</label>
					<div class="col-md-9">
						<div class="col-xl-8 col-lg-7 col-9">
							<select
								class="form-select"
								bind:value={permissions}
								id="permissions"
								class:is-invalid={$shareValidationErrors['permissions']}
								required
							>
								<option value="">Select...</option>
								<option value="r">Read</option>
								<option value="rw">Read, Write</option>
								<option value="rwx">Read, Write, Execute</option>
							</select>
						</div>
						{#if $shareValidationErrors['permissions']}
							<div class="invalid-feedback">{$shareValidationErrors['permissions']}</div>
						{/if}
					</div>
				</div>
				<div class="row">
					<div class="offset-md-3">
						<div id="genericShareError"></div>
						<input type="submit" class="btn btn-primary" value="Share" disabled={sharing} />
					</div>
				</div>
			</form>
		</div>
	</div>
</div>

<Modal id="editGuestModal" size="lg" bind:this={editGuestModal} focus={false}>
	{#snippet header()}
		{#if guestToEdit}
			<h1 class="h5 modal-title flex-grow-1">Edit {guestToEdit.email} sharing options</h1>
		{/if}
	{/snippet}
	{#snippet body()}
		<div class="row mb-2">
			<label for="edit-permissions" class="col-md-3 col-form-label">Permissions</label>
			<div class="col-md-9">
				<div class="col-xl-8 col-lg-7 col-9">
					<select class="form-select" bind:value={permissionsToEdit} id="edit-permissions" required>
						<option value="r">Read</option>
						<option value="rw">Read, Write</option>
						<option value="rwx">Read, Write, Execute</option>
					</select>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col">
				<div id="errorAlert-editGuestModal"></div>
			</div>
		</div>
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-primary" onclick={confirmEditGuest} disabled={saving}>
			{#if saving}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			{/if}
			Save
		</button>
		<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
	{/snippet}
</Modal>
