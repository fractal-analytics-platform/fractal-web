<script context = "module">

  export let user = null;
  let error = "";

  export function doLogin(event) {
    const formData = new FormData(event.target);
    const request = new XMLHttpRequest();

    request.addEventListener("load", (event) => {
      if (event.target.status != 200) {
//       alert("Fail!");
        error = 'Incorrect username and password.'
      }
      else {
        window.location = "/me";
      }
    });

    request.withCredentials = true;
    request.open("POST", "http://127.0.0.1:8000/auth/login")
    request.send(formData);
  }

  export function doLogout() {
    const request = new XMLHttpRequest();
     request.addEventListener("load", (event) => {
      if (event.target.status != 200) {
        alert("Fail!");
      }
      else {
        user = null;
        window.location = "/";
      }
    });

    request.withCredentials = true;
    request.open("POST", "http://127.0.0.1:8000/auth/logout");
    request.send();
  }

</script>

{#if !user}
<form on:submit|preventDefault={doLogin} style="padding-top:20%;" class="flex mx-auto col-6">


	<div class="mb-3">
		<label for="email" class="form-label">Email</label>
		<input type="text" class="form-control" id="email" name="username" />
	</div>

	<div class="mb-3">
		<label for="password" class="form-label">Password</label>
		<input type="password" class="form-control" id="password" name="password"/>
	</div>

	<button type="submit" class="btn btn-primary">Login</button>
	<div id="error_message" class="text-danger">
		<small>{error}</small>
	</div>

</form>
{:else}

<meta http-equiv="refresh" content="0; url='/me'" />

{/if}
