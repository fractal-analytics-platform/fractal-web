<script>
	import { env } from '$env/dynamic/public';
	import { page } from '$app/stores';

	$: userLoggedIn = !!$page.data.userInfo;
</script>

<h1 class="fw-light">Welcome to Fractal web client.</h1>

<div>
	<p>
		Welcome to the web client of Fractal, a framework to process high-content imaging data at scale
		and prepare it for interactive visualization.
	</p>
	<p>
		To access Fractal features, you should first log-in as a registered user. Navigate to the
		<i>Projects</i>
		page to create new projects and to create/edit/execute image-analysis workflows. The
		<i>Tasks</i> page lets you view/edit the available image-analysis tasks or create new ones. The
		<i>Jobs</i> page lets you view jobs associated to your projects.
	</p>

	<div class="col mb-3">
		{#if !userLoggedIn}
			<a href="/auth/login" class="btn btn-primary">Login</a>
		{/if}
		<a href="/v2/projects" class="btn btn-primary">Projects</a>
		<a href="/v2/tasks" class="btn btn-primary">Tasks</a>
		<a href="/v2/jobs" class="btn btn-primary">Jobs</a>
		{#if import.meta.env.MODE === 'development'}
			<a href="/sandbox" class="btn btn-primary">Sandbox</a>
		{/if}
	</div>

	{#if $page.data.v1Enabled}
		<p>
			This is the new version 2 of Fractal. Your older projects and workflows are still available in
			the legacy version that you can access in <a href="/v1/projects">the legacy project page</a>.
			We encourage you to switch to Fractal V2 for all new projects and report any issues you find.
		</p>
		<p>
			We strictly separate projects, datasets and workflows into Fractal V2 and legacy. You can use
			many of your existing tasks in the Fractal V2 version without any changes required. If you
			don't find the task you require in Fractal V2, please reach out to the support.
		</p>
	{/if}

	{#if env.PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL}
		<h3 class="fw-light">Where to get support</h3>
		<p>
			<a href="mailto:{env.PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL}">
				{env.PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL}
			</a>
		</p>
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
