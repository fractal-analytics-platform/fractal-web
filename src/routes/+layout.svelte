<script>
  import { page } from "$app/stores";
  import Login from '$lib/login.svelte';

  let home_url;
  if ($page.data.user) {
    home_url = "/me";
  } else {
    home_url = "/";
  }
</script>

<nav>
  <a href="{ home_url }">Fractal</a>
  <Login user={$page.data.user} />
</nav>

<slot></slot>


<style>
  nav {
    padding: 1rem;
    box-shadow: -1px 1px 11px 4px #898989;
  }

  a {
    text-decoration: none;
    color: gray;
    margin-right: 1rem;
  }
</style>
