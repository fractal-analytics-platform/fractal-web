<script>
	import { page } from '$app/state';
	import { sortDropdownUsers } from '$lib/components/admin/user_utilities';

	let { form } = $props();
	let userId = $state('');

	let users = $derived(sortDropdownUsers(page.data.users, page.data.userInfo.id));
</script>

<div class="container mt-3">
	<h1 class="fw-light mb-3">Impersonate users</h1>

	<form class="row mt-3 mt-4" method="post">
		<div class="col col-lg-5 col-md-8">
			<div class="input-group mb-2">
				<label class="input-group-text" for="user">User</label>
				<select class="form-select" bind:value={userId} id="user" name="user_id">
					<option value="">Select</option>
					{#each users as user (user.id)}
						{#if user.id !== page.data.userInfo.id}
							<option value={user.id}>{user.email}</option>
						{/if}
					{/each}
				</select>
				<input type="submit" class="btn btn-primary" disabled={!userId} value="Impersonate" />
			</div>
			{#if form?.invalidMessage}
				<div class="text-danger">
					{form?.invalidMessage}
				</div>
			{/if}
		</div>
	</form>
</div>