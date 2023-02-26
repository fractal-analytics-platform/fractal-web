<script>
  import { goto } from '$app/navigation'
  import { userStore } from '$lib/stores/authStores'

  // Redirect to root page if the userStore is not undefined
  if ($userStore !== undefined) {
    goto('/')
  }

</script>

<h1>Login</h1>

<div class="container">
  <div class="col-md-4">
    <form method="POST">
      <div class="mb-3">
        <label for="userEmail" class="form-label">Email address</label>
        <input name="username" type="email" class="form-control" id="userEmail" aria-describedby="emailHelp">
        <div id="emailHelp" class="form-text">We'll never share your email with anyone else.</div>
      </div>
      <div class="mb-3">
        <label for="userPassword" class="form-label">Password</label>
        <input name="password" type="password" class="form-control" id="userPassword">
      </div>
      <button class="btn btn-primary">Submit</button>
    </form>
  </div>
</div>
