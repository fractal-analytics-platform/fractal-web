<script>
	import { page } from '$app/state';

	/** @type {import('fractal-components/types/api').Resource} */
	const resource = $derived(page.data.resource);
	/** @type {import('fractal-components/types/api').Profile} */
	const profile = $derived(page.data.profile);
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
			<li class="breadcrumb-item active" aria-current="page">#{profile.id}</li>
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
	<div class="col-md-10 col-lg-8">
		<table class="table">
			<tbody>
				<tr>
					<th>Profile ID</th>
					<td>{profile.id}</td>
				</tr>
				<tr>
					<th>Resource ID</th>
					<td>{profile.resource_id}</td>
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
