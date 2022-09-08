<script>
  let user = null;

  function get_user_info() {
    fetch(
      "http://127.0.0.1:8000/auth/users/me",
      {
        credentials: "include",
        // mode: "no-cors"
      }
    ).then((answer) => answer.json())
    .then((json) => user = json.email);
  }

  function doLogin(event) {
    const formData = new FormData(event.target);
    const request = new XMLHttpRequest();

    request.addEventListener("load", (event) => {
      if (event.srcElement.status != 200) {
        alert("fail");
      }
      else {
        get_user_info();
      }
    });

    request.withCredentials = true;
    request.open("POST", "http://127.0.0.1:8000/auth/login")
    request.send(formData);
  }

  function doLogout() {
    const request = new XMLHttpRequest();
     request.addEventListener("load", (event) => {
      if (event.srcElement.status != 200) {
        alert("fail");
      }
      else {
        user = null;
      }
    });

    request.withCredentials = true;
    request.open("POST", "http://127.0.0.1:8000/auth/logout");
    request.send();
  }
</script>

{#if !user}
<form on:submit|preventDefault={doLogin}>
  <label for="email">email:</label><br>
  <input type="text" id="email" name="username"><br>

  <label for="password">password:</label><br>
  <input type="text" id="password" name="password">

  <input 
    type="submit"
    value="Login"
  />
</form>
{:else}
  <p>{user}</p>
  <form on:submit|preventDefault={doLogout}>
  <input type="submit" value="Logout"/>
</form>
{/if}
