<script>
    import Login from '$lib/login.svelte'
    import "/src/global.css"
    export let data;
</script>
  
<nav class="navbar navbar-expand-lg navbar-light bg-light" >
<a href="/">Fractal</a>
</nav>


<Login user={data.user} />
