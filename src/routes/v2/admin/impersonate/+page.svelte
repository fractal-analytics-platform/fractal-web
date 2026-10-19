<script>
	import { page } from '$app/state';
	import { sortDropdownUsers } from '#lib/components/admin/user_utilities.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let userId = $state('');
	let invalidMessage = $state('');
	const currentUserId = $derived(page.data.userInfo.id);
	const users = $derived(sortDropdownUsers(page.data.users, page.data.userInfo.id));

	async function impersonate() {
		invalidMessage = '';
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch('/v2/admin/impersonate', {
			method: 'POST',
			headers,
			body: JSON.stringify({ userId })
		});
		if (response.ok) {
			await goto(resolve(`/v2/projects`));
		} else {
			try {
				const result = await response.json();
				invalidMessage = result.invalidMessage || '';
			} catch (err) {
				invalidMessage = 'Unexpected error';
			}
		}
	}
</script>

<div class="container mt-3">
	<h1 class="fw-light mb-3">Impersonate users</h1>

	<form
		class="row mt-3 mt-4"
		onsubmit={(e) => {
			e.preventDefault();
			impersonate();
		}}
	>
		<div class="col col-lg-5 col-md-8">
			<div class="input-group mb-2">
				<label class="input-group-text" for="user">User</label>
				<select class="form-select" bind:value={userId} id="user" name="user_id">
					<option value="">Select</option>
					{#each users as user (user.id)}
						{#if user.id !== currentUserId}
							<option value={user.id}>{user.email}</option>
						{/if}
					{/each}
				</select>
				<input type="submit" class="btn btn-primary" disabled={!userId} value="Impersonate" />
			</div>
			{#if invalidMessage}
				<div class="text-danger">
					{invalidMessage}
				</div>
			{/if}
		</div>
	</form>
</div>
