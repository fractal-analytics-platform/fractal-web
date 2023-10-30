<script>
	import { page } from '$app/stores';

	export let form;
	let loginError = false;

	if (form?.invalid) {
		loginError = true;
	}

	$: userLoggedIn = !!$page.data.userInfo;
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
	{/if}
</div>
