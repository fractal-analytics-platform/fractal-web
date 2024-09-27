<script>
	import { page } from '$app/stores';

	/** @type {string[]} */
	let viewerPaths = $page.data.viewerPaths;
</script>

<h1 class="fw-light mb-3">Viewer paths</h1>

<ul>
	{#each viewerPaths as viewerPath}
		<li><code>{viewerPath}</code></li>
	{/each}
</ul>
