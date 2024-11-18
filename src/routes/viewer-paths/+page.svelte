<script>
	import { page } from '$app/stores';

	/** @type {string[]} */
	const viewerPaths = $page.data.viewerPaths;
	/** @type {import('$lib/types').UserSettings} */
	const settings = $page.data.settings;
</script>

<h1 class="fw-light mb-3">Viewer paths</h1>

<p>
	This Fractal instance includes an online viewer for OME-Zarrs, based on
	<a href="https://github.com/hms-dbmi/vizarr" target="_blank">vizarr</a>. Browse to a dataset page,
	and you will find links to view the available images in the browser.
</p>

<p>
	Note that access to image data is restricted to OME-Zarrs within certain paths (and their
	subfolders).
	{#if settings.project_dir || viewerPaths.length > 0}
		The list of paths accessible to the current user includes:
	{:else}
		The list of paths accessible to the current user is empty.
	{/if}
</p>

<ul>
	{#if settings.project_dir}
		<li><code>{settings.project_dir}</code></li>
	{/if}
	{#each viewerPaths as viewerPath}
		<li><code>{viewerPath}</code></li>
	{/each}
</ul>

<p>
	Depending on the Fractal configuration, you may also have access to additional paths.<br />
	Please contact an admin if you see an error message like <code>403 Forbidden</code> when opening the
	image viewer.
</p>
