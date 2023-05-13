<script>
  export let form
  let loginError = false

  if (form?.invalid) {
		loginError = true
  }

</script>

<div class="container">
  <div class="row">
    <h1>Login</h1>
  </div>
  <div class="row">
    <div class="col-md-4">
      <form method="POST">
        <div class="mb-3">
          <label for="userEmail" class="form-label">Email address</label>
          <input name="username" type="email" class="form-control { loginError ? 'is-invalid' : '' }" id="userEmail" aria-describedby="emailHelp" required>
          <div id="emailHelp" class="form-text">The email you provided to the IT manager</div>
          <div class="invalid-feedback">
            { form?.invalidMessage }
          </div>
        </div>
        <div class="mb-3">
          <label for="userPassword" class="form-label">Password</label>
          <input name="password" type="password" class="form-control" id="userPassword" required>
        </div>
        <button class="btn btn-primary">Submit</button>
      </form>
    </div>
  </div>
</div>
