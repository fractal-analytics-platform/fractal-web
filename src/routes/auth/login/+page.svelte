<script>
  import { goto } from '$app/navigation'
  import { enhance } from '$app/forms'
  import { userStore } from '$lib/stores/authStores'

  export let form
  export let data

  $: {
    // Redirect to root page if the userStore is not undefined
    if ($userStore !== undefined) {
      goto('/')
    }
  }

  $: loginSuccess = form?.loginSuccess

</script>

<div class="container">
  <div class="row">
    <h1>Login</h1>
  </div>
  <div class="row">
    <div class="col-md-4">
      <form method="POST" class="" use:enhance>
        <div class="mb-3">
          <label for="userEmail" class="form-label">Email address</label>
          <input name="username" type="email" class="form-control { loginSuccess != undefined && !loginSuccess ? 'is-invalid' : '' }" id="userEmail" aria-describedby="emailHelp" required>
          <div id="emailHelp" class="form-text">The email you provided to the IT manager</div>
          <div class="invalid-feedback">
            Can not perform login with the data provided
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
