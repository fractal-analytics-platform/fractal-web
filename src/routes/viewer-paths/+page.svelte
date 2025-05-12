<script>
	import { page } from '$app/state';

	/** @type {string[]} */
	const viewerPaths = $derived(page.data.viewerPaths);
</script>

<div class="container mt-3">
	<h1 class="fw-light mb-3">Viewer paths</h1>

	<p>
		This Fractal instance includes an online viewer for OME-Zarrs, based on
		<a href="https://github.com/hms-dbmi/vizarr" target="_blank">vizarr</a>. Browse to a dataset
		page, and you will find links to view the available images in the browser.
	</p>

	<p>
		Note that access to image data is restricted to OME-Zarrs within certain paths (and their
		subfolders).
		{#if viewerPaths.length > 0}
			These are the accessible paths:
		{:else}
			The list of paths accessible to the current user is empty.
		{/if}
	</p>

	<ul>
		{#each viewerPaths as viewerPath (viewerPath)}
			<li><code>{viewerPath}</code></li>
		{/each}
	</ul>

	<p>
		Please contact an admin if you see an error message like <code>403 Forbidden</code> when opening
		the image viewer.
	</p>
</div>
