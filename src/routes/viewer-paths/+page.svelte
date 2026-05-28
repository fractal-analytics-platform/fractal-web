<script>
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';

	/** @type {string[]} */
	const viewerPaths = $derived(page.data.viewerPaths);
</script>

<div class="container mt-3">
	<h1 class="fw-light mb-3">Viewer paths</h1>

	<p>
		This Fractal instance includes
		{#if env.PUBLIC_FRACTAL_VIZARR_VIEWER_URL}
			an online viewer for OME-Zarrs, based on
			<a href="https://github.com/hms-dbmi/vizarr" target="_blank">Vizarr</a>
		{/if}
		{#if env.PUBLIC_FRACTAL_VIZARR_VIEWER_URL && env.PUBLIC_FRACTAL_VOLE_VIEWER_URL}
			and
		{/if}
		{#if env.PUBLIC_FRACTAL_VOLE_VIEWER_URL}
			an online viewer for OME-Zarrs, based on
			<a href="https://github.com/allen-cell-animated/vole-app" target="_blank">Vol-E</a>
		{/if}. Browse to a dataset page, and you will find links to view the available images in the
		browser.
	</p>

	<p>
		Note that access to image data is restricted to OME-Zarrs within certain paths (and their
		subfolders). The accessible paths are:
	</p>

	<ul>
		{#each viewerPaths as viewerPath (viewerPath)}
			<li><code>{viewerPath}</code></li>
		{/each}
		<li>and the zarr directories of all datasets you have access to.</li>
	</ul>

	<p>
		Please contact an admin if you see an error message like <code>403 Forbidden</code> when opening the
		image viewer.
	</p>
</div>
