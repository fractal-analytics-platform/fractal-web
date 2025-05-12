<script>
	import logoSmall from '$lib/assets/fractal-logo-small.png';
	import { browser } from '$app/environment';
	import { afterNavigate, beforeNavigate, goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import { navigating, navigationCancelled } from '$lib/stores';

	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();

	// @ts-ignore
	// eslint-disable-next-line no-undef
	let clientVersion = __APP_VERSION__;

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

	let loading = $state(true);

	onMount(() => {
		loading = false;
		if (sessionStorage && userLoggedIn) {
			sessionStorage.setItem('userLoggedIn', 'true');
		}
	});

	beforeNavigate(async () => {
		if (!$navigationCancelled) {
			navigating.set(true);
		}
		navigationCancelled.set(false);
	});

	afterNavigate(async () => {
		navigating.set(false);
		if (location.href.includes('invalidate=true')) {
			await invalidateAll();
		}
		cleanupModalBackdrop();
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

	async function getToken() {
		const response = await fetch(`/profile/token`);
		if (response.ok) {
			const { token } = await response.json();
			await navigator.clipboard.writeText(token);
			const toastElement = document.getElementById('tokenCopiedToast');
			if (!toastElement) {
				return;
			}
			// @ts-expect-error
			// eslint-disable-next-line no-undef
			const toast = new bootstrap.Toast(toastElement);
			toast.show();
		}
	}

	const selectedSection = $derived(getSelectedSection(page.url.pathname));
	const userLoggedIn = $derived(!!page.data.userInfo);
	const isAdmin = $derived(userLoggedIn && page.data.userInfo.is_superuser);
	const server = $derived(page.data.serverInfo || {});
	const warningBanner = $derived(page.data.warningBanner);
	const userEmail = $derived(userLoggedIn ? page.data.userInfo.email : undefined);
	const isVerified = $derived(userLoggedIn && page.data.userInfo.is_verified);
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
					<li class="nav-item dropdown" id="user-menu">
						<a
							class="nav-link dropdown-toggle"
							href="#user"
							role="button"
							data-bs-toggle="dropdown"
							aria-expanded="false"
						>
							<i class="bi bi-person-circle"></i>
							{userEmail}
						</a>
						<ul class="dropdown-menu">
							<li><a class="dropdown-item" href="/profile">My profile</a></li>
							<li><a class="dropdown-item" href="/settings">My settings</a></li>
							{#if env.PUBLIC_FRACTAL_VIZARR_VIEWER_URL}
								<li><a class="dropdown-item" href="/viewer-paths">Viewer paths</a></li>
							{/if}
							<li><a class="dropdown-item" href="/healthcheck">Test job submission</a></li>
							<li>
								<button class="dropdown-item" onclick={getToken}> Get token </button>
							</li>
							<li><button class="dropdown-item" onclick={logout}>Logout</button></li>
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
		<div class="admin-border"></div>
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
				{#each warningBanner.split('\n') as line, index (index)}
					{#if index > 0}
						<br />
					{/if}
					{line}
				{/each}
			</div>
		</div>
	{/if}
	{#if userLoggedIn && !isVerified}
		<div class="container mt-3">
			<div class="row">
				<div class="col">
					<div class="alert alert-warning">
						<i class="bi bi-exclamation-triangle"></i>
						<strong>Warning</strong>: as a non-verified user, you have limited access; please
						contact an admin.
					</div>
				</div>
			</div>
		</div>
	{/if}
	{@render children?.()}
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
	<div class="toast-container position-fixed bottom-0 end-0 p-3">
		<div
			id="tokenCopiedToast"
			class="toast align-items-center text-bg-info border-0"
			role="alert"
			aria-live="assertive"
			aria-atomic="true"
		>
			<div class="d-flex">
				<div class="toast-body">Token copied to clipboard</div>
				<button
					type="button"
					class="btn-close btn-close-white me-2 m-auto"
					data-bs-dismiss="toast"
					aria-label="Close"
				></button>
			</div>
		</div>
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
		transition:
			visibility 0s,
			opacity 0.5s linear;
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
