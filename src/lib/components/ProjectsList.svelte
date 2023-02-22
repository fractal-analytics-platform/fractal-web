<script>
    export let projects = []
</script>

<h1>Projects</h1>

<table class="table table-hover">
    <thead class="table-light">
        <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Directory</th>
            <th>Options</th>
        </tr>
    </thead>
    <tbody>
        { #each projects as { id, name, project_dir } }
            <tr>
                <td>{id}</td>
                <td>{name}</td>
                <td>{project_dir}</td>
                <td></td>
            </tr>
        {/each}
    </tbody>
</table>