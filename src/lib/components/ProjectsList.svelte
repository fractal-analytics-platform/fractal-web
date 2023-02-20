<script>
    export let projects = []
</script>

<h1>Projects list component</h1>
<ul>
    { #each projects as { id, name, project_dir } }
        <li>
            <span>{id}</span> - <span>{name}</span> - <span>{project_dir}</span>
        </li>
    {/each}
</ul>