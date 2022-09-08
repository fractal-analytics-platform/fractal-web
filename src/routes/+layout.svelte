<script>
  import { page } from "$app/stores";
  import Login from '$lib/login.svelte';
</script>


<h1>Fractal</h1>
<h2>Analytics Platform</h2>

<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
  <Login user={$page.data.user} />
</nav>

<slot></slot>
