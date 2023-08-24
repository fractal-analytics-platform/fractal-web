<script>
	import { page } from '$app/stores';

	$: userLoggedIn = !!$page.data.userInfo;
	$: server = $page.data.serverInfo || {};
</script>

<main>
	<nav class="bg-light border-bottom">
		<div class="container d-flex flex-wrap">
			<ul class="nav me-auto">
				<li class="nav-item">
					<a href="/" class="nav-link">Home</a>
				</li>
				{#if userLoggedIn}
					<li class="nav-item">
						<a href="/projects" class="nav-link">Projects</a>
					</li>
					<li class="nav-item">
						<a href="/tasks" class="nav-link">Tasks</a>
					</li>
				{/if}
			</ul>
			<ul class="nav">
				<li class="nav-item">
					{#if !userLoggedIn}
						<a href="/auth/login" class="nav-link">Login</a>
					{:else}
						<a href="/auth/logout" class="nav-link">Logout</a>
					{/if}
				</li>
			</ul>
		</div>
	</nav>
	<div class='container p-4'>
		<slot />
	</div>
	<div class="container">
		<footer
			class="d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top"
		>
			<div class="col-md-4 d-flex align-items-center">
				<span class="mb-3 mb-md-0 text-muted">
					<a href="https://fractal-analytics-platform.github.io">Fractal Analytics Platform</a>
				</span>
			</div>
			<div class="col-md-4 d-flex justify-content-center">
				<div class="hstack gap-3">
					<span class="font-monospace">{server.version}</span>
					<div class="vr" />
					<span class="font-monospace">{server.deployment_type}</span>
				</div>
			</div>
			<ul class="nav col-md-4 justify-content-end d-flex">
				<li class="ms-2">
					<a class="text-muted fs-4" href="https://github.com/fractal-analytics-platform">
						<i class="bi bi-github" />
					</a>
				</li>
			</ul>
		</footer>
	</div>
</main>
