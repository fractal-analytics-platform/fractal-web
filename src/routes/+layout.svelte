<script>
  import { userStore } from '$lib/stores/authStores'

  // data from load function
  export let data

  if ($userStore === undefined && data.user != undefined) {
    userStore.set(data.user)
  }

</script>
<main>
  <nav class='bg-light border-bottom'>
    <div class='container d-flex flex-wrap'>
      <ul class='nav me-auto'>
        <li class='nav-item'>
          <a href='/' class='nav-link'>Home</a>
        </li>
        {#if $userStore !== undefined}
          <li class='nav-item'>
            <a href='/info' class='nav-link'>Info</a>
          </li>
          <li class='nav-item'>
            <a href='/projects' class='nav-link'>Projects</a>
          </li>
        {/if}
      </ul>
      <ul class='nav'>
        <li class='nav-item'>
          {#if $userStore === undefined }
            <a href='/auth/login' class='nav-link'>Login</a>
          {:else}
            <a href='/auth/logout' class='nav-link'>Logout</a>
          {/if}
        </li>
      </ul>
    </div>
  </nav>
  <header class='py-4 mb-4 border-bottom'>
    <div class='container'>
      <h1 class='h4'>Fractal web client</h1>
    </div>
  </header>
  <div class='container'>
    <slot></slot>
  </div>
  <div class='container'>
    <footer class='d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top'>
      <div class="col-md-4 d-flex align-items-center">
                <span class="mb-3 mb-md-0 text-muted">
                    <a href='https://fractal-analytics-platform.github.io'>Fractal Analytics Platform</a>
                </span>
      </div>
      <ul class="nav col-md-4 justify-content-end d-flex">
        <li class="ms-2">
          <a class="text-muted fs-4" href="https://github.com/fractal-analytics-platform">
            <i class="bi bi-github"></i>
          </a>
        </li>
      </ul>
    </footer>
  </div>
</main>