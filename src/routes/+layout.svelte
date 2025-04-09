<script>
	import logoSmall from '$lib/assets/fractal-logo-small.png';
	import { browser } from '$app/environment';
	import { afterNavigate, goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';

	$: userLoggedIn = !!$page.data.userInfo;
	$: isAdmin = userLoggedIn && $page.data.userInfo.is_superuser;
	$: server = $page.data.serverInfo || {};
	$: warningBanner = $page.data.warningBanner;
	// @ts-ignore
	// eslint-disable-next-line no-undef
	let clientVersion = __APP_VERSION__;

	// Detects page change
	$: if ($navigating) cleanupModalBackdrop();

	$: selectedSection = getSelectedSection($page.url.pathname);

	/**
	 * Removes the modal backdrop that remains stuck at page change.
	 */
	function cleanupModalBackdrop() {
		document.querySelector('.modal-backdrop')?.remove();
		const body = document.querySelector('body');
		body?.classList.remove('modal-open');
		body?.style.removeProperty('overflow');
		body?.style.removeProperty('padding-right');
	}

	if (browser) {
		// Overriding global fetch function to detect unauthorized requests
		const originalFetch = window.fetch;
		window.fetch = async function (input, init) {
			const response = await originalFetch(input, init);
			if (response.status === 401) {
				// Reloading the page to trigger a redirect to login page
				location.reload();
			}
			return response;
		};
	}

	/**
	 * @param {string} pathname
	 */
	function getSelectedSection(pathname) {
		if (pathname === '/') {
			return 'home';
		}
		for (const section of ['projects', 'tasks', 'jobs', 'admin', 'auth']) {
			if (pathname.startsWith(`/${section}`) || pathname.startsWith(`/v2/${section}`)) {
				return section;
			}
		}
	}

	let loading = true;

	onMount(() => {
		loading = false;
		if (sessionStorage && userLoggedIn) {
			sessionStorage.setItem('userLoggedIn', 'true');
		}
	});

	afterNavigate(async () => {
		if (location.href.includes('invalidate=true')) {
			await invalidateAll();
		}
	});

	async function logout() {
		sessionStorage.removeItem('userLoggedIn');
		await fetch(`/auth/token/logout`, {
			method: 'POST',
			credentials: 'include'
		});
		await invalidateAll();
		goto('/');
	}
</script>

<main>
	<nav class="bg-light border-bottom">
		<div class="container d-flex flex-wrap">
			<ul class="nav me-auto">
				<li class="nav-item">
					<a href="/" class="nav-link" id="home-link" class:active={selectedSection === 'home'}>
						<img alt="Fractal logo" src={logoSmall} />
					</a>
				</li>
				{#if userLoggedIn}
					<li class="nav-item">
						<a href="/v2/projects" class="nav-link" class:active={selectedSection === 'projects'}>
							Projects
						</a>
					</li>
					<li class="nav-item">
						<a href="/v2/tasks" class="nav-link" class:active={selectedSection === 'tasks'}>
							Tasks
						</a>
					</li>
					<li class="nav-item">
						<a href="/v2/jobs" class="nav-link" class:active={selectedSection === 'jobs'}> Jobs </a>
					</li>
					{#if isAdmin}
						<li class="nav-item">
							<a href="/v2/admin" class="nav-link" class:admin-active={selectedSection === 'admin'}>
								Admin area
							</a>
						</li>
					{/if}
				{/if}
			</ul>
			<ul class="nav">
				{#if userLoggedIn}
					<li class="nav-item dropdown">
						<a
							class="nav-link dropdown-toggle"
							href="#user"
							role="button"
							data-bs-toggle="dropdown"
							aria-expanded="false"
						>
							<i class="bi bi-person-circle" />
							{$page.data.userInfo.email}
						</a>
						<ul class="dropdown-menu">
							<li><a class="dropdown-item" href="/profile">My profile</a></li>
							<li><a class="dropdown-item" href="/settings">My settings</a></li>
							{#if env.PUBLIC_FRACTAL_VIZARR_VIEWER_URL}
								<li><a class="dropdown-item" href="/viewer-paths">Viewer paths</a></li>
							{/if}
							<li><a class="dropdown-item" href="/healthcheck">Test job submission</a></li>
							<li><button class="dropdown-item" on:click={logout}>Logout</button></li>
						</ul>
					</li>
				{:else}
					<li class="nav-item">
						<a href="/auth/login" class="nav-link" class:active={selectedSection === 'auth'}>
							Login
						</a>
					</li>
				{/if}
			</ul>
		</div>
	</nav>
	{#if selectedSection === 'admin'}
		<div class="admin-border" />
	{/if}
	{#if !server.alive}
		<div class="container mt-3">
			<div class="alert alert-danger">
				Sorry, we are performing some maintenance on fractal-server. It will be back online soon.
			</div>
		</div>
	{/if}
	{#if warningBanner}
		<div class="container mt-3">
			<div class="alert alert-warning">
				{#each warningBanner.split('\n') as line, index}
					{#if index > 0}
						<br />
					{/if}
					{line}
				{/each}
			</div>
		</div>
	{/if}
	{#if userLoggedIn && !$page.data.userInfo.is_verified}
		<div class="container mt-3">
			<div class="row">
				<div class="col">
					<div class="alert alert-warning">
						<i class="bi bi-exclamation-triangle" />
						<strong>Warning</strong>: as a non-verified user, you have limited access; please
						contact an admin.
					</div>
				</div>
			</div>
		</div>
	{/if}
	<slot />
	<div class="d-flex flex-column min-vh-100 min-vw-100 loading" class:show={$navigating || loading}>
		<div class="d-flex flex-grow-1 justify-content-center align-items-center">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	</div>
	<div class="container">
		<footer
			class="d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top"
		>
			<div class="col d-flex justify-content-center">
				<div class="hstack gap-3">
					<span class="font-monospace">
						{#if server.version}
							fractal-server {server.version},
						{/if}
						fractal-web {clientVersion}
					</span>
				</div>
			</div>
		</footer>
	</div>
</main>

<style>
	#home-link img {
		height: 24px;
	}

	#home-link:hover img {
		transform: rotate(-7deg) scale(1.2);
	}

	.nav-link.active {
		background-color: #eee;
		border-bottom-width: 3px;
		border-bottom-style: solid;
	}

	.nav-link.admin-active {
		background-color: #eee;
	}

	.admin-border {
		height: 8px;
		background-color: #dc3545;
	}

	.loading {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		background-color: rgba(255, 255, 255, 0.8);
		visibility: hidden;
		opacity: 0;
		transition: visibility 0s, opacity 0.5s linear;
		transition-delay: 250ms;
		transition-property: visibility;
	}

	.loading.show {
		visibility: visible;
		opacity: 1;
		z-index: 2000;
	}

	.loading .spinner-border {
		width: 3rem;
		height: 3rem;
	}
</style>
