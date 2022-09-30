<script>
  import {ProjectDelete} from "$lib/Project.js";
  export let projectList;

  async function doDelete(project) {
    try {
      await ProjectDelete(project.id);
      projectList = projectList.filter((prj) => prj.id !== project.id);
    }
    catch (e) {
      alert(e) 
    }
  };

</script>

{#if projectList}
<h3 class='text-center' style="padding-top:5%;" >Project List</h3>
  <div class="container mt-3">
    <table class="table table-hover table-bordered">
      <thead>
        <tr>
          <th scope="col">ID</th>
          <th scope="col">Name</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>

        {#each projectList as p}
        <tr>
          <th scope="row"> {p.id}</th>
          <td><a href='/me/project/{p.id}'>{p.name}</a></td>
          <td>
            <div class="d-flex flex-row  mb-3">
              <div ><button type="button" class="btn" on:click|preventDefault={doDelete(p)}>
                <i class="material-icons text-danger">Delete</i>
              </button></div>
          </td>
        </tr>
        {/each}

      </tbody>
    </table>
  </div>
{/if}

