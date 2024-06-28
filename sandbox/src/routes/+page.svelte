<script>
	import { onMount } from 'svelte';
	import JSchemaSandbox from '$lib/components/JSchemaSandbox.svelte';
	import VersionUpdateSandbox from '$lib/components/VersionUpdateSandbox.svelte';

	const pages = ['jschema', 'version-update'];

	let currentPage = 'jschema';

	onMount(() => {
		for (const page of pages) {
			if (`#${page}` === location.hash) {
				currentPage = page;
				break;
			}
		}
	});
</script>

<nav class="navbar navbar-expand-lg bg-light mb-3 border-bottom">
	<div class="container">
		<a class="navbar-brand" href="https://fractal-analytics-platform.github.io/fractal-web/">
			Documentation
		</a>
		<ul class="navbar-nav me-auto">
			<li class="nav-item">
				<a
					class="nav-link"
					class:active={currentPage === 'jschema'}
					href="#jschema"
					on:click={() => (currentPage = 'jschema')}
				>
					JSON Schema
				</a>
			</li>
			<li class="nav-item">
				<a
					class="nav-link"
					class:active={currentPage === 'version-update'}
					on:click={() => (currentPage = 'version-update')}
					href="#version-update"
				>
					Version update
				</a>
			</li>
		</ul>
	</div>
</nav>

<div class="container">
	{#if currentPage === 'jschema'}
		<JSchemaSandbox />
	{:else if currentPage === 'version-update'}
		<VersionUpdateSandbox />
	{/if}
</div>
