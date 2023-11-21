<script>
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	import { onMount } from 'svelte';

	$: userLoggedIn = !!$page.data.userInfo;
	$: server = $page.data.serverInfo || {};
	// @ts-ignore
	// eslint-disable-next-line no-undef
	let clientVersion = __APP_VERSION__;

	// Detects page change
	$: if ($navigating) cleanupModalBackdrop();

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

	let loading = true;

	onMount(() => {
		loading = false;
		if (sessionStorage && userLoggedIn) {
			sessionStorage.setItem('userLoggedIn', 'true');
		}
	});
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
					<li class="nav-item">
						<a href="/jobs" class="nav-link">Jobs</a>
					</li>
				{/if}
			</ul>
			<ul class="nav">
				{#if userLoggedIn}
					<span class="navbar-text">{$page.data.userInfo.email}</span>
				{/if}
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
	<div class="container p-4">
		<slot />
	</div>
	<div class="d-flex flex-column min-vh-100 min-vw-100 loading" class:d-none={!($navigating || loading)}>
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
						fractal-server {server.version}, fractal-web {clientVersion}
					</span>
				</div>
			</div>
		</footer>
	</div>
</main>

<style>
	.loading {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		background-color: rgba(255, 255, 255, 0.8);
	}

	.loading .spinner-border {
		width: 3rem;
		height: 3rem;
	}
</style>
