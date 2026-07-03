<script>
	import 'bootstrap/dist/css/bootstrap.css';
	import 'bootstrap-icons/font/bootstrap-icons.css';
	import slimSelectCss from 'slim-select/styles?url';

	import logoSmall from '$lib/assets/fractal-logo-small.png';
	import { browser } from '$app/environment';
	import { afterNavigate, beforeNavigate, goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import {
		currentHelpLink,
		navigating,
		navigationCancelled,
		navigatingFromHelpModal
	} from '$lib/stores';
	import { resolve } from '$app/paths';
	import { buildHelpLink } from '$lib/common/component_utilities';
	import HelpModal from '$lib/components/common/HelpModal.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();

	// @ts-ignore
	// eslint-disable-next-line no-undef
	let clientVersion = __APP_VERSION__;

	function getOpenedModal() {
		const modalElement = document.querySelector('.modal.show');
		if (modalElement instanceof HTMLElement) {
			// @ts-ignore
			// eslint-disable-next-line no-undef
			return bootstrap.Modal.getInstance(modalElement);
		}
	}

	/**
	 * Removes the modals or modal backdrops that remains stuck at page change.
	 */
	function cleanupModalBackdrop() {
		getOpenedModal()?.hide();
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
		for (const section of ['projects', 'datasets', 'tasks', 'jobs', 'templates', 'admin', 'auth']) {
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

	beforeNavigate(async (navigation) => {
		const modal = getOpenedModal();
		if (modal && !$navigatingFromHelpModal) {
			modal.hide();
			navigation.cancel();
			return;
		}
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
			method: 'POST'
		});
		await invalidateAll();
		await goto(resolve('/'));
	}

	async function getToken() {
		const promise = getTokenPromise();
		await navigator.clipboard.write([new ClipboardItem({ 'text/plain': promise })]);
		const toastElement = document.getElementById('tokenCopiedToast');
		if (!toastElement) {
			return;
		}
		// @ts-expect-error
		// eslint-disable-next-line no-undef
		const toast = new bootstrap.Toast(toastElement);
		toast.show();
	}

	/**
	 * Safari doesn't allow to run asynchronous code between the click event and the
	 * clipboard write, so we need to pass the promise to the ClipboardItem constructor.
	 */
	async function getTokenPromise() {
		const response = await fetch(`/profile/token`);
		if (response.ok) {
			const { token } = await response.json();
			// Chrome only accept a promise returning Blob type, with proper content type.
			return new Blob([token], { type: 'text/plain' });
		}
		throw new Error('Unable to retrieve token');
	}

	const selectedSection = $derived(getSelectedSection(page.url.pathname));
	const userLoggedIn = $derived(!!page.data.userInfo);
	const isAdmin = $derived(userLoggedIn && page.data.userInfo.is_superuser);
	const server = $derived(page.data.serverInfo || {});
	const warningBanner = $derived(page.data.warningBanner);
	const userEmail = $derived(userLoggedIn ? page.data.userInfo.email : undefined);
	const helpLink = $derived(buildHelpLink(page.data.helpLink));
</script>

<svelte:head>
	<link rel="stylesheet" href={slimSelectCss} />
</svelte:head>

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
						<a href="/v2/datasets" class="nav-link" class:active={selectedSection === 'datasets'}>
							Datasets
						</a>
					</li>
					<li class="nav-item">
						<a href="/v2/templates" class="nav-link" class:active={selectedSection === 'templates'}>
							Templates
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
					{#if helpLink}
						<li class="nav-item">
							<button
								class="nav-link"
								aria-label="Help page"
								onclick={() => currentHelpLink.set(helpLink)}
							>
								<i class="bi bi-question-circle"></i>
							</button>
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
							{#if env.PUBLIC_FRACTAL_DATA_URL && (env.PUBLIC_FRACTAL_VIZARR_VIEWER_URL || env.PUBLIC_FRACTAL_VOLE_VIEWER_URL)}
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
			class="toast align-items-center bg-info-subtle border-0"
			role="alert"
			aria-live="assertive"
			aria-atomic="true"
		>
			<div class="d-flex">
				<div class="toast-body text-black">Token copied to clipboard</div>
				<button
					type="button"
					class="btn-close btn-close-black opacity-75 me-2 m-auto"
					data-bs-dismiss="toast"
					aria-label="Close"
				></button>
			</div>
		</div>
	</div>
	<div class="toast-container position-fixed bottom-0 end-0 p-3">
		<div
			class="toast align-items-center bg-warning-subtle"
			role="alert"
			aria-live="assertive"
			aria-atomic="true"
			id="normalization-toast"
		>
			<div class="d-flex">
				<div class="toast-body">
					Some request parameters have been normalized:
					<ul id="normalized-parameters"></ul>
				</div>
				<button
					type="button"
					class="btn-close me-2 m-auto"
					data-bs-dismiss="toast"
					aria-label="Close"
				></button>
			</div>
		</div>
	</div>
	<HelpModal />
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
		color: #0a59cc;
	}

	.nav-link {
		color: #0769f9;
	}

	.nav-link.admin-active {
		background-color: #eee;
		color: #0a59cc;
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

	:global(.viewer-btn) {
		background-repeat: no-repeat;
		background-position: center;
		min-width: 45px;
	}

	:global(.vizarr-btn) {
		background-image: url('$lib/assets/logo-vizarr.svg');
		background-size: 80%;
	}

	:global(body) {
		--ss-primary-color: #0d6efd;
		--ss-placeholder-color: #757575;
	}

	:global(.bg-light .text-danger) {
		color: #d53343 !important;
	}

	:global(.alert-danger code, .alert-warning code) {
		color: #b32a6e;
	}

	:global(.btn-secondary:disabled) {
		color: #000;
		background: #e1e1e1;
	}
</style>
