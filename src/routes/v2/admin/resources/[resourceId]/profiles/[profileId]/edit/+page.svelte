<script>
	import { page } from '$app/state';
	import ProfileEditor from '$lib/components/v2/admin/ProfileEditor.svelte';
	import { deepCopy, normalizePayload } from 'fractal-components';
	import { onMount } from 'svelte';

	/** @type {import('fractal-components/types/api').Resource} */
	const resource = $derived(page.data.resource);
	/** @type {import('fractal-components/types/api').Profile | undefined} */
	let profile = $state();

	onMount(() => {
		profile = deepCopy(page.data.profile);
	});

	/**
	 * @param {import('fractal-components/types/api').Profile} profile
	 */
	async function saveProfile(profile) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		return await fetch(`/api/admin/v2/profile/${profile.id}`, {
			method: 'PUT',
			credentials: 'include',
			headers,
			body: normalizePayload(profile, { nullifyEmptyStrings: true })
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
			{#if profile}
				<li class="breadcrumb-item active" aria-current="page">
					Edit {profile.name} (#{profile.id})
				</li>
			{/if}
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
