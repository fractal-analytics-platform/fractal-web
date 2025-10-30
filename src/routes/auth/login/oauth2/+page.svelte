<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	const message = $derived(page.data.message);

	onMount(async () => {
		if (message) {
			if (sessionStorage) {
				sessionStorage.setItem('temporary-message', message);
			}
			await goto('/');
		}
	});
</script>

<div class="container mt-5">Loading...</div>
