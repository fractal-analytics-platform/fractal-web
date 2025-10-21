<script>
	import { page } from '$app/state';
	import { sortUserByEmailComparator } from '$lib/common/user_utilities';

	/** @type {import('fractal-components/types/api').Resource} */
	const resource = $derived(page.data.resource);
	/** @type {import('fractal-components/types/api').Profile} */
	const profile = $derived(page.data.profile);
	/** @type {Array<import('fractal-components/types/api').User>} */
	const users = $derived(page.data.users.sort(sortUserByEmailComparator));
</script>

<div class="container mt-3">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item">
				<a href="/v2/admin">Admin area</a>
			</li>
			<li class="breadcrumb-item">
				<a href="/v2/admin/resources">Resources</a>
			</li>
			<li class="breadcrumb-item">
				<a href="/v2/admin/resources/{resource.id}">{resource.name}</a>
			</li>
			<li class="breadcrumb-item">
				<a href="/v2/admin/resources/{resource.id}/profiles">Profiles</a>
			</li>
			<li class="breadcrumb-item active" aria-current="page">{profile.name}</li>
		</ol>
	</nav>

	<a
		href="/v2/admin/resources/{resource.id}/profiles/{profile.id}/edit"
		class="btn btn-primary float-end"
	>
		<i class="bi bi-pencil"></i>
		Edit
	</a>
</div>

<div class="container">
	<div class="row">
		<div class="col-md-10 col-lg-8 mt-3">
			<table class="table">
				<tbody>
					<tr>
						<th>Profile ID</th>
						<td>{profile.id}</td>
					</tr>
					<tr>
						<th>Profile Name</th>
						<td>{profile.name}</td>
					</tr>
					<tr>
						<th>Resource ID</th>
						<td>{profile.resource_id}</td>
					</tr>
					<tr>
						<th>Resource Type</th>
						<td>{profile.resource_type}</td>
					</tr>
					{#if resource.type === 'slurm_sudo' || resource.type === 'slurm_ssh'}
						<tr>
							<th>Username</th>
							<td>{profile.username || '-'}</td>
						</tr>
					{/if}
					{#if resource.type === 'slurm_ssh'}
						<tr>
							<th>SSH key path</th>
							<td>{profile.ssh_key_path || '-'}</td>
						</tr>
					{/if}
					{#if resource.type === 'slurm_ssh'}
						<tr>
							<th>Jobs remote dir</th>
							<td>{profile.jobs_remote_dir || '-'}</td>
						</tr>
					{/if}
					{#if resource.type === 'slurm_ssh'}
						<tr>
							<th>Tasks remote dir</th>
							<td>{profile.tasks_remote_dir || '-'}</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
	<div class="row">
		<div class="col-md-10 col-lg-8">
			{#if users.length > 0}
				<div class="accordion mt-3 ms-3 me-5 mb-5" id="accordion-users">
					<div class="accordion-item">
						<h2 class="accordion-header">
							<button
								class="accordion-button collapsed"
								type="button"
								data-bs-toggle="collapse"
								data-bs-target="#collapse-users"
								aria-expanded="false"
								aria-controls="collapseThree"
							>
								Users ({users.length})
							</button>
						</h2>
						<div
							id="collapse-users"
							class="accordion-collapse collapse"
							data-bs-parent="#accordion-users"
						>
							<div class="accordion-body">
								<ul>
									{#each users as user (user.id)}
										<li>
											<a href="/v2/admin/users/{user.id}">{user.email}</a>
										</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<p class="ms-3 mt-3">There are no users associated with this profile</p>
			{/if}
		</div>
	</div>
</div>
