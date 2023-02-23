<script>
    import { page } from '$app/stores'
    export let projects = []

    let errorReasons = ''

    if ($page.form && $page.form.createAction) {
        if ($page.form.createAction.success == false) {
            errorReasons = JSON.stringify($page.form.createAction.reason, undefined, 2)
        }
    }

</script>

<h1>Projects</h1>

<div class="container">
    <div class="row mt-3 mb-3">
        <div class="col-sm-12">
            <form method="post" action="?/create" class="row justify-content-end">
                <div class="col-auto">
                    <div class="input-group">
                        <div class="input-group-text">Project name</div>
                        <input name="projectName" type="text" class="form-control">
                    </div>
                </div>
                <div class="col-auto">
                    <div class="input-group">
                        <div class="input-group-text">Project directory</div>
                        <input name="projectDirectory" type="text" class="form-control">
                    </div>
                </div>

                <div class="col-auto">
                    <button type="submit" class="btn btn-primary">Create</button>
                </div>
            </form>
            {#if errorReasons != '' }
                <div class="row p-4">
                    <div class="alert alert-danger">
                        <pre>There has been an error, reason:</pre>
                        <pre>{errorReasons}</pre>
                    </div>
                </div>
            {/if}
        </div>
    </div>
    <div class="row">
        <table class="table table-hover">
            <thead class="table-light">
            <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Directory</th>
                <th>Readonly</th>
                <th>Options</th>
            </tr>
            </thead>
            <tbody>
            { #each projects as { id, name, project_dir, read_only } }
                <tr>
                    <td>{id}</td>
                    <td>{name}</td>
                    <td>{project_dir}</td>
                    <td>{read_only}</td>
                    <td class="align-right">
                        <button class="btn"><i class="bi bi-info-circle"></i></button>
                        <button class="btn">Open <i class="bi bi-arrow-up-right-square"></i></button>
                        <button class="btn btn-warning" disabled>Edit</button>
                        <button class="btn btn-danger" disabled>Delete</button>
                    </td>
                </tr>
            {/each}
            </tbody>
        </table>
    </div>
</div>

