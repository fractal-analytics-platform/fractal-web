<script>
	import { page } from '$app/stores';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors.js';
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';

	export let form;
	let loginError = false;

	if (form?.invalid) {
		loginError = true;
	}

	$: userLoggedIn = !!$page.data.userInfo;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let externalLoginErrorAlert = undefined;

	const oauth2Provider = env.PUBLIC_OAUTH_CLIENT_NAME;

	async function oauth2Login() {
		if (externalLoginErrorAlert) {
			externalLoginErrorAlert.hide();
		}
		const response = await fetch(`/api/auth/${oauth2Provider}/authorize`);
		if (!response.ok) {
			externalLoginErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'externalLoginError'
			);
			return;
		}
		const result = await response.json();
		window.location.replace(result.authorization_url);
	}

	let showSessionExpiredMessage = false;
	onMount(async () => {
		if (location.href.includes('invalidate=true')) {
			await invalidateAll();
		}
		if (!userLoggedIn && sessionStorage && sessionStorage.getItem('userLoggedIn') === 'true') {
			showSessionExpiredMessage = true;
			sessionStorage.removeItem('userLoggedIn');
		}
	});
</script>

<div class="container mt-3">
	{#if userLoggedIn}
		<div class="row mt-4">
			<div class="col">
				You are already logged in, click <a href="/auth/logout">here</a> to log out.
			</div>
		</div>
	{:else}
		<div class="row">
			<h1 class="fw-light mb-4">Login</h1>
		</div>
		{#if showSessionExpiredMessage}
			<div class="row">
				<div class="col-md-4">
					<div class="alert alert-warning">Session expired. Please login again.</div>
				</div>
			</div>
		{/if}
		{#if oauth2Provider}
			<div class="row">
				<div class="col mb-4 pb-3">
					<h3 class="fw-light">Institutional login</h3>
					<div id="externalLoginError" />
					<button type="button" on:click={oauth2Login} class="btn btn-primary">
						{#if oauth2Provider === 'github'}
							Log in with GitHub
						{:else if oauth2Provider === 'google'}
							Log in with Google
						{:else}
							Log in with institutional account
						{/if}
					</button>
				</div>
			</div>
		{/if}

		<div class="row">
			<div class="col-xl-4 col-lg-7 col-md-9">
				<div class="accordion">
					<div class="accordion-item">
						{#if oauth2Provider}
							<h2 class="accordion-header">
								<button
									class="accordion-button collapsed"
									type="button"
									data-bs-toggle="collapse"
									data-bs-target="#localLoginCollapse"
									aria-expanded="false"
									aria-controls="localLoginCollapse"
								>
									Log in with username & password
								</button>
							</h2>
						{/if}
						<div
							id="localLoginCollapse"
							class="accordion-collapse collapse"
							class:show={!oauth2Provider}
						>
							<div class="accordion-body">
								<form method="POST">
									<div class="mb-3">
										<p class="fw-light">
											Log in with Fractal specific email & password provided to you by the Fractal
											admin
										</p>
										<label for="userEmail" class="form-label">Email address</label>
										<input
											name="username"
											type="email"
											class="form-control {loginError ? 'is-invalid' : ''}"
											id="userEmail"
											required
										/>
										<div class="invalid-feedback">
											{form?.invalidMessage}
										</div>
									</div>
									<div class="mb-3">
										<label for="userPassword" class="form-label">Password</label>
										<input
											name="password"
											type="password"
											class="form-control"
											id="userPassword"
											required
										/>
									</div>
									<button class="btn btn-primary">Log in</button>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
