<script>
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	/** @type {import('fractal-components/types/api').Resource} */
	const resource = $derived(page.data.resource);

	/** @type {Array<import('fractal-components/types/api').Profile>} */
	let profiles = $state([]);
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let searchErrorAlert;

	async function loadProfiles() {
		searchErrorAlert?.hide();
		const url = new URL(`/api/admin/v2/resource/${resource.id}/profile`, window.location.origin);
		const response = await fetch(url);
		if (!response.ok) {
			searchErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'searchError'
			);
			return;
		}
		profiles = await response.json();
	}

	/**
	 * @param {number} id
	 */
	async function handleDeleteProfile(id) {
		const response = await fetch(`/api/admin/v2/profile/${id}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			profiles = profiles.filter((r) => r.id !== id);
		} else {
			throw await getAlertErrorFromResponse(response);
		}
	}

	onMount(async () => {
		await loadProfiles();
	});
</script>

<div class="container mt-3">
	<div class="row">
		<div class="col">
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
					<li class="breadcrumb-item active" aria-current="page">Profiles</li>
				</ol>
			</nav>

			<a href="/v2/admin/resources/{resource.id}/profiles/create" class="btn btn-primary float-end">
				<i class="bi bi-plus-circle"></i>
				New profile
			</a>
		</div>
	</div>

	<div class="row">
		<table class="table">
			<thead>
				<tr>
					<th>Id</th>
					<th>Name</th>
					{#if resource.type === 'slurm_sudo' || resource.type === 'slurm_ssh'}
						<th>Username</th>
					{/if}
					{#if resource.type === 'slurm_ssh'}
						<th>SSH key path</th>
					{/if}
					{#if resource.type === 'slurm_ssh'}
						<th>Jobs remote dir</th>
					{/if}
					{#if resource.type === 'slurm_ssh'}
						<th>Tasks remote dir</th>
					{/if}
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each profiles as profile (profile.id)}
					<tr>
						<td>{profile.id}</td>
						<td>{profile.name}</td>
						{#if resource.type === 'slurm_sudo' || resource.type === 'slurm_ssh'}
							<td>{profile.username || '-'}</td>
						{/if}
						{#if resource.type === 'slurm_ssh'}
							<td>{profile.ssh_key_path || '-'}</td>
						{/if}
						{#if resource.type === 'slurm_ssh'}
							<td>{profile.jobs_remote_dir || '-'}</td>
						{/if}
						{#if resource.type === 'slurm_ssh'}
							<td>{profile.tasks_remote_dir || '-'}</td>
						{/if}
						<td>
							<a
								href="/v2/admin/resources/{resource.id}/profiles/{profile.id}"
								class="btn btn-light"
							>
								<i class="bi-info-circle"></i> Info
							</a>
							<a
								href="/v2/admin/resources/{resource.id}/profiles/{profile.id}/edit"
								class="btn btn-primary"
							>
								<i class="bi bi-pencil"></i> Edit
							</a>
							<ConfirmActionButton
								modalId={'confirmDeleteProfile' + profile.id}
								style="danger"
								btnStyle="danger"
								message="Delete profile {profile.id}"
								buttonIcon="trash"
								label="Delete"
								callbackAction={() => handleDeleteProfile(profile.id)}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<div id="searchError" class="mt-3"></div>
	</div>
</div>
