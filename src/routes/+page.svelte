<script>
	import { env } from '$env/dynamic/public';
	import { page } from '$app/stores';

	$: userLoggedIn = !!$page.data.userInfo;
</script>

<h1>Welcome to Fractal web client.</h1>

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
		<a href="/projects" class="btn btn-primary">Projects</a>
		<a href="/tasks" class="btn btn-primary">Tasks</a>
		<a href="/jobs" class="btn btn-primary">Jobs</a>
	</div>

	{#if env.PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL}
		<h3>Where to get support</h3>
		<p>
			<a href="mailto:{env.PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL}">
				{env.PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL}
			</a>
		</p>
	{/if}

	<h3>Links</h3>

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
