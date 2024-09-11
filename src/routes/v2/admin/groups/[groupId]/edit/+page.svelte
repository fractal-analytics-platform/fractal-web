<script>
	import { page } from '$app/stores';
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import { sortUserByEmailComparator } from '$lib/common/user_utilities';

	/** @type {import('$lib/types').Group & {user_ids: number[]}} */
	$: group = $page.data.group;
	/** @type {Array<import('$lib/types').User & {id: number}>} */
	$: users = $page.data.users;

	/** @type {import('$lib/types').User & {id: number}|null} */
	let draggedUser = null;
	/** @type {import('$lib/types').User & {id: number}|null} */
	let addingUser = null;
	let hovering = false;
	let userFilter = '';

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

		const previousUserIs = [...group.user_ids]; // copy the old values
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
	<div class="col-6">
		<h4 class="fw-light">Members of the group</h4>
		<div
			class="droparea bg-light p-2"
			id="members-container"
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
					<span class="badge text-bg-secondary me-2">
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
</div>
