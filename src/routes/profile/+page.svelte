<script>
	import { page } from '$app/stores';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';

	/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} */
	let user = $derived($page.data.user);
</script>

<div class="container mt-3">
	<h1 class="fw-light">My profile</h1>

	<div class="row mt-4">
		<div class="col-lg-10 col-xl-8">
			<table class="table">
				<colgroup>
					<col width="170" />
					<col width="auto" />
				</colgroup>
				<tbody>
					<tr>
						<th>User ID</th>
						<td>{user.id}</td>
					</tr>
					<tr>
						<th>E-mail</th>
						<td>{user.email}</td>
					</tr>
					<tr>
						<th>Username</th>
						<td>{user.username || '-'}</td>
					</tr>
					<tr>
						<th>Active</th>
						<td><BooleanIcon value={user.is_active} /></td>
					</tr>
					<tr>
						<th>Superuser</th>
						<td><BooleanIcon value={user.is_superuser} /></td>
					</tr>
					<tr>
						<th>Verified</th>
						<td><BooleanIcon value={user.is_verified} /></td>
					</tr>
					<tr>
						<th>Groups</th>
						<td>
							<!-- eslint-disable-next-line no-unused-vars -->
							{#each user.group_ids_names as [_, group_name]}
								<span class="badge text-bg-light me-2 mb-2 fs-6 fw-normal">{group_name}</span>
							{/each}
						</td>
					</tr>
					<tr>
						<th>OAuth2 accounts</th>
						<td>
							{#if user.oauth_accounts.length === 0}
								-
							{:else}
								<table class="table mb-0">
									{#each user.oauth_accounts as account}
										<tr>
											<th>{account.oauth_name}</th>
											<td>{account.account_email}</td>
										</tr>
									{/each}
								</table>
							{/if}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</div>
