<script>
    import { PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL } from '$env/static/public';
</script>

<h1>Welcome to Fractal web client.</h1>

<div>
<p>Welcome to Fractal web client!</p>

<h3>Typical actions</h3>
<p>
A small (one-paragraph) description of typical actions the user may want to do.
This includes a link to the login page, which should be made extremely visible.
</p>

<div class="col mb-3">
    <a href="/auth/login" class="btn btn-primary">Login</a>
    <a href="/projects" class="btn btn-primary">Projects</a>
    <a href="/tasks" class="btn btn-primary">Tasks</a>
</div>

<h3>Where to get support</h3>
{#if PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL}
<p>
    <a href="mailto:{PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL}">{PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL}</a>
</p>
{/if}

(this has to be an env variable, since it may change for each Fractal instance).
<br>
<h3>Links</h3>
<p>
More info on Fractal are available at: https://fractal-analytics-platform.github.io.
Development of the different Fractal component takes place on GitHub, within the https://github.com/fractal-analytics-platform organization.
</p>

</div>