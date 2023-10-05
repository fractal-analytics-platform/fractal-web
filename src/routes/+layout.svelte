<script>
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';

	$: userLoggedIn = !!$page.data.userInfo;
	$: server = $page.data.serverInfo || {};

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
	<div class="container">
		<footer
			class="d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top"
		>
			<div class="col d-flex justify-content-center">
				<div class="hstack gap-3">
					<span class="font-monospace">{server.version}</span>
				</div>
			</div>
		</footer>
	</div>
</main>
