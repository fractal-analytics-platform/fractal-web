<script>
  // import { page } from "$app/stores";
  import Login from '$lib/login.svelte';

  export let data;
</script>

<nav>
  <a href="/">Fractal</a>
  <Login user={data.user} />
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
