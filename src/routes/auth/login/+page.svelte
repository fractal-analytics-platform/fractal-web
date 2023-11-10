<script>
	import { page } from '$app/stores';
	import { displayStandardErrorAlert } from '$lib/common/errors.js';

	export let form;
	let loginError = false;

	if (form?.invalid) {
		loginError = true;
	}

	$: userLoggedIn = !!$page.data.userInfo;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let externalLoginErrorAlert = undefined;

	async function gitHubLogin() {
		if (externalLoginErrorAlert) {
			externalLoginErrorAlert.hide();
		}
		const response = await fetch('/auth/github/authorize');
		const result = await response.json();
		if (!response.ok) {
			externalLoginErrorAlert = displayStandardErrorAlert(result, 'externalLoginError');
			return;
		}
		window.location.replace(result.authorization_url);
	}
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
		<div class="row">
			<div class="col mt-5">
				<h3>External account</h3>
				<div id="externalLoginError" />
				<button type="button" on:click={gitHubLogin} class="btn btn-primary">
					Login with GitHub
				</button>
			</div>
		</div>
	{/if}
</div>
