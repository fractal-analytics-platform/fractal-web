<script>
  import { PUBLIC_FRACTAL_SERVER_HOST } from '$env/static/public'
  import { onMount } from 'svelte'
  import { whoami } from '$lib/api/v1/auth/auth_api'
  import { userStore } from '$lib/stores/authStores'
  import { serverInfo } from '$lib/stores/serverStores'

  $: userLoggedIn = $userStore !== undefined
  $: server = $serverInfo || {}

  onMount(async () => {
    if ($userStore === undefined) {
      const user = await whoami().catch(() => {
        console.info('Unable to fetch user identity')
      })
      userStore.set(user)
    }
    if ($serverInfo === undefined) {
      fetchServerInfo()
    }
  })

  const fetchServerInfo = async () => {
    const info = await fetch(PUBLIC_FRACTAL_SERVER_HOST + '/api/alive/', {
      method: 'GET'
    })
      .then(async (response) => {
        return await response.json()
      })
    serverInfo.set(info)
  }

</script>

<main>
  <nav class='bg-light border-bottom'>
    <div class='container d-flex flex-wrap'>
      <ul class='nav me-auto'>
        <li class='nav-item'>
          <a href='/' class='nav-link'>Home</a>
        </li>
        {#if userLoggedIn }
          <li class='nav-item'>
            <a href='/info' class='nav-link'>Info</a>
          </li>
          <li class='nav-item'>
            <a href='/projects' class='nav-link'>Projects</a>
          </li>
          <li class='nav-item'>
            <a href='/tasks' class='nav-link'>Tasks</a>
          </li>
        {/if}
      </ul>
      <ul class='nav'>
        <li class='nav-item'>
          {#if !userLoggedIn }
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
      <div class="col-md-4 d-flex justify-content-center">
        <div class="hstack gap-3">
          <span class="font-monospace">{server.version}</span><div class="vr"></div><span class="font-monospace">{server.deployment_type}</span>
        </div>
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