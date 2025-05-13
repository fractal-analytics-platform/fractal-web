<script>
	import { env } from '$env/dynamic/public';
	import { page } from '$app/state';
	import logoMedium from '$lib/assets/fractal-logo-medium.png';
	import { formatMarkdown } from '$lib/common/component_utilities';
	import { onMount } from 'svelte';

	let userLoggedIn = $derived(!!page.data.userInfo);
	let news = $derived(page.data.news);

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<div class="container mt-3">
	<img alt="Fractal logo" src={logoMedium} class="float-end" id="fractal-logo-home" />

	<h1 class="fw-light">Welcome to Fractal web client.</h1>

	<div>
		<p>
			Fractal is a framework developed at the
			<a href="https://www.biovisioncenter.uzh.ch/en.html">BioVisionCenter</a>
			to process bioimaging data at scale in the OME-Zarr format and prepare the images for interactive
			visualization.
		</p>
		<p>
			To access Fractal features, you should first log-in as a registered user. Navigate to the
			<i>Projects</i>
			page to create new projects and to create/edit/execute image-analysis workflows. The
			<i>Tasks</i> page lets you view/edit the available image-analysis tasks or create new ones.
			The
			<i>Jobs</i> page lets you view jobs associated to your projects.
		</p>

		<div class="col mb-3">
			{#if !userLoggedIn}
				<a href="/auth/login" class="btn btn-primary">Login</a>
			{/if}
			<a href="/v2/projects" class="btn btn-primary">Projects</a>
			<a href="/v2/tasks" class="btn btn-primary">Tasks</a>
			<a href="/v2/jobs" class="btn btn-primary">Jobs</a>
		</div>

		{#if env.PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL}
			<h3 class="fw-light">Where to get support</h3>
			<p>
				<a href="mailto:{env.PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL}">
					{env.PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL}
				</a>
			</p>
		{/if}

		{#if news && mounted}
			<h3 class="fw-light">News</h3>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html formatMarkdown(news)}
		{/if}

		<h3 class="fw-light">Links</h3>

		<ul>
			<li>
				<a href="https://fractal-analytics-platform.github.io" target="_blank">
					Home page of the Fractal project
				</a>
			</li>
			<li>
				<a href="https://github.com/fractal-analytics-platform" target="_blank">
					Fractal GitHub organization
				</a>
				(where development takes place)
			</li>
		</ul>
	</div>
</div>

<style>
	#fractal-logo-home {
		margin-top: 20px;
		margin-left: 30px;
		height: 220px;
	}

	@media (max-width: 768px) {
		#fractal-logo-home {
			height: 140px;
		}
	}
</style>
