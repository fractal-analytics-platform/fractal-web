<script>
	import { browser } from '$app/environment';
	import { afterNavigate, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	import { reloadVersionedPage } from '$lib/common/selected_api_version';
	import { onMount } from 'svelte';

	$: userLoggedIn = !!$page.data.userInfo;
	$: isAdmin = userLoggedIn && $page.data.userInfo.is_superuser;
	$: server = $page.data.serverInfo || {};
	/** @type {'v1'|'v2'} */
	$: apiVersion = $page.url.pathname.startsWith('/v1') ? 'v1' : 'v2';
	// @ts-ignore
	// eslint-disable-next-line no-undef
	let clientVersion = __APP_VERSION__;

	$: displayVersionSelector =
		$page.data.v1Enabled &&
		(!isSubPage($page.url.pathname, apiVersion) ||
			$page.url.pathname === '/v2/admin/jobs' ||
			$page.url.pathname === '/v1/admin/jobs') &&
		!$page.url.pathname.startsWith('/sandbox') &&
		selectedSection !== 'home';

	/**
	 * Returns true if the URL indicates a subpage.
	 * Values need to be passed to trigger the reactivity.
	 * @param {string} pathname
	 * @param {string} version
	 * @returns {boolean}
	 */
	function isSubPage(pathname, version) {
		if (!pathname.startsWith(`/${version}/`)) {
			return false;
		}
		if (pathname.endsWith('/')) {
			pathname = pathname.substring(0, pathname.length - 1);
		}
		return pathname.substring(4).includes('/');
	}

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
		for (const section of ['projects', 'tasks', 'jobs', 'admin', 'auth', 'sandbox']) {
			if (pathname.startsWith(`/${section}`) || pathname.startsWith(`/${apiVersion}/${section}`)) {
				return section;
			}
		}
	}

	/**
	 * @param {'v1'|'v2'} version
	 */
	function setSelecteApiVersion(version) {
		reloadVersionedPage($page.url.pathname, version);
	}

	let loading = true;

	$: {
		if (selectedSection === 'home') {
			setSelecteApiVersion('v2');
		}
	}

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
</script>

<main>
	<nav class="bg-light border-bottom" class:legacy={apiVersion === 'v1'}>
		<div class="container d-flex flex-wrap">
			<ul class="nav me-auto">
				<li class="nav-item">
					<a href="/" class="nav-link" class:active={selectedSection === 'home'}> Home </a>
				</li>
				{#if import.meta.env.MODE === 'development' && selectedSection === 'sandbox'}
					<li class="nav-item">
						<a href="/sandbox" class="nav-link" class:active={selectedSection === 'sandbox'}>
							Sandbox pages
						</a>
					</li>
				{/if}
				{#if userLoggedIn}
					<li class="nav-item">
						<a
							href="/{apiVersion}/projects"
							class="nav-link"
							class:active={selectedSection === 'projects'}
						>
							Projects
						</a>
					</li>
					<li class="nav-item">
						<a
							href="/{apiVersion}/tasks"
							class="nav-link"
							class:active={selectedSection === 'tasks'}
						>
							Tasks
						</a>
					</li>
					<li class="nav-item">
						<a href="/{apiVersion}/jobs" class="nav-link" class:active={selectedSection === 'jobs'}>
							Jobs
						</a>
					</li>
					{#if isAdmin}
						<li class="nav-item">
							<a
								href="/{apiVersion}/admin"
								class="nav-link"
								class:admin-active={selectedSection === 'admin'}
							>
								Admin area
							</a>
						</li>
					{/if}
				{/if}
			</ul>
			<ul class="nav">
				{#if userLoggedIn}
					{#if displayVersionSelector}
						<li class="nav-item">
							{#if apiVersion === 'v1'}
								<button
									class="btn btn-info mt-1 pt-1 pb-1 border-primary"
									type="button"
									on:click={() => setSelecteApiVersion('v2')}
								>
									Switch to Fractal V2
								</button>
							{:else}
								<button
									class="btn btn-outline-secondary mt-1 pt-1 pb-1"
									type="button"
									on:click={() => setSelecteApiVersion('v1')}
								>
									Switch to legacy Fractal
								</button>
							{/if}
						</li>
					{:else if apiVersion === 'v1'}
						<li class="navbar-text me-3">
							<span class="badge text-bg-secondary">legacy</span>
						</li>
					{/if}
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
							<li><a class="dropdown-item" href="/auth/logout">Logout</a></li>
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
	{#if apiVersion === 'v1'}
		<div class="legacy-border" />
	{/if}
	{#if selectedSection === 'admin'}
		<div class="admin-border" />
	{/if}
	<div class="container p-4">
		{#if !server.alive && selectedSection !== 'sandbox'}
			<div class="alert alert-danger">
				Sorry, we are performing some maintenance on fractal-server. It will be back online soon.
			</div>
		{/if}
		{#if userLoggedIn && !$page.data.userInfo.is_verified}
			<div class="row">
				<div class="col">
					<div class="alert alert-warning">
						<i class="bi bi-exclamation-triangle" />
						<strong>Warning</strong>: as a non-verified user, you have limited access; please
						contact an admin.
					</div>
				</div>
			</div>
		{/if}
		<slot />
	</div>
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
	nav.legacy {
		background-color: #e4e4e4 !important;
		border-bottom-color: #888 !important;
	}

	nav.legacy .nav-link.active {
		background-color: #d0d0d0 !important;
	}

	.legacy-border {
		height: 6px;
		background-color: #888;
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
