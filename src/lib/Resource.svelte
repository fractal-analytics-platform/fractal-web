<script>
	export let resource;
	import {ResourceDelete} from "$lib/Project.js";
    export let resource_list;
	export let projectId;
	export let datasetId;


  async function doDelete(resource) {
    try {
      await ResourceDelete(projectId, datasetId, resource.id);
      resource_list = resource_list.filter((rsc) => rsc.id !== resource.id);
      window.location.reload(); // FIXME update list without reloading

	}
    catch (e) {
      alert(e) 
    }
  };
</script>


<tr>
	<th scope="row">{resource.id}</th>
	<td>{resource.path}</td>
	<td>*.{resource.glob_pattern}</td>
	<td>
		<div class="d-flex">
			<div ><button type="button" class="btn" on:click|preventDefault={doDelete(resource)}>
                <i class="material-icons text-danger">Delete</i>
              </button></div>
	
		<div ><button type="button" class="btn" >
			<!-- data-bs-toggle="modal" data-bs-target="#dataset{resource.id}"   -->
			<i class="material-icons text-info">Edit</i>
		</button></div>
		<!-- EDIT MODAL ADD WHEN ENDPOINT IS IN PLACE
			 <div class="modal fade" id="resource{resource.id}" tabindex="-1" 
		aria-labelledby="resource{resource.id}Label" aria-hidden="true">
	
			<div class="modal-dialog">
			<div class="modal-content">

				<div class="modal-header">
				<h5 class="modal-title" 
				id="#resource{resource.id}Label">Edit {resource.name}</h5>
				<button type="button" class="btn-close" 
				data-bs-dismiss="modal" aria-label="Close"></button>
	
				</div>
				<div class="modal-body">
				  <form id="edit" name="edit" class="flex mx-auto col-6">
		
	
					<div class="mb-3">
					  <label for="path" class="form-label">Path</label>
					  <input type="text" class="form-control" id="path" name="path"
					  >
					</div>
					<div class="mb-3">
					  <label for="pattern" class="form-label">Type</label>
					  <input type="text" class="form-control" id="pattern" name="pattern"
					  >
					</div>
				  </form>
				  <div class="modal-footer">
	
				  <button type="button" class="btn btn-primary btn-sm" on:click|preventDefault={editResource()}>Edit</button>
	
				<button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
			  </div>
			  </div>
			</div>
		  </div> -->

	</div>
	</td>
</tr>


