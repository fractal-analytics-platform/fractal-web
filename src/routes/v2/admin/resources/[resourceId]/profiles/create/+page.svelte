<script>
	import { page } from '$app/state';
	import ProfileEditor from '$lib/components/v2/admin/ProfileEditor.svelte';
	import { normalizePayload } from 'fractal-components';
	import { onMount } from 'svelte';

	/** @type {import('fractal-components/types/api').Resource} */
	const resource = $derived(page.data.resource);

	/** @type {Omit<import('fractal-components/types/api').Profile, 'id'> | undefined} */
	let profile = $state();

	onMount(() => {
		profile = {
			resource_id: resource.id,
			jobs_remote_dir: '',
			ssh_key_path: '',
			tasks_remote_dir: '',
			username: ''
		};
	});

	/**
	 * @param {Omit<import('fractal-components/types/api').Profile, 'id'>} profile
	 */
	async function saveProfile(profile) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		return await fetch(`/api/admin/v2/resource/${resource.id}/profile`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: normalizePayload({ ...profile, resource_id: undefined }, { nullifyEmptyStrings: true })
		});
	}
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
			<li class="breadcrumb-item active" aria-current="page">New profile</li>
		</ol>
	</nav>

	<div class="row mt-4">
		<div class="col">
			{#if profile}
				<ProfileEditor {profile} {resource} {saveProfile} />
			{/if}
		</div>
	</div>
</div>
