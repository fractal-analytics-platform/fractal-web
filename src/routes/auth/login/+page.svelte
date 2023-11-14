<script>
	import { page } from '$app/stores';
	import { displayStandardErrorAlert } from '$lib/common/errors.js';
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

	$: oauth2Provider = env.PUBLIC_OAUTH_CLIENT_NAME;

	async function oauth2Login() {
		if (externalLoginErrorAlert) {
			externalLoginErrorAlert.hide();
		}
		const response = await fetch(`/auth/${oauth2Provider}/authorize`);
		const result = await response.json();
		if (!response.ok) {
			externalLoginErrorAlert = displayStandardErrorAlert(result, 'externalLoginError');
			return;
		}
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

<div class="container">
	{#if userLoggedIn}
		<div class="row mt-4">
			<div class="col">
				You are already logged in, click <a href="/auth/logout">here</a> to log out.
			</div>
		</div>
	{:else}
		<div class="row">
			<h1>Login</h1>
		</div>
		{#if showSessionExpiredMessage}
			<div class="row">
				<div class="col-md-4">
					<div class="alert alert-warning">Session expired. Please login again.</div>
				</div>
			</div>
		{/if}
		<div class="row">
			<div class="col-md-4">
				<h3 class="mt-2">Local account</h3>
				<form method="POST">
					<div class="mb-3">
						<label for="userEmail" class="form-label">Email address</label>
						<input
							name="username"
							type="email"
							class="form-control {loginError ? 'is-invalid' : ''}"
							id="userEmail"
							aria-describedby="emailHelp"
							required
						/>
						<div id="emailHelp" class="form-text">The email you provided to the IT manager</div>
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
					<button class="btn btn-primary">Submit</button>
				</form>
			</div>
		</div>
		{#if oauth2Provider}
			<div class="row">
				<div class="col mt-5">
					<h3>External account</h3>
					<div id="externalLoginError" />
					<button type="button" on:click={oauth2Login} class="btn btn-primary">
						{#if oauth2Provider === 'github'}
							Login with GitHub
						{:else if oauth2Provider === 'google'}
							Login with Google
						{:else}
							Login with OAuth2 provider
						{/if}
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>
