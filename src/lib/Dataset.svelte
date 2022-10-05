<script>
    import Swal from 'sweetalert2'

	import ResourceAdd from "$lib/ResourceAdd.svelte";
	import Resource from "$lib/Resource.svelte";
    import {ProjectEditDataset} from "$lib/Project"
	export let dataset;
	export let projectId;
	let patchDataset_status;


  async function editDataset(project_id, dataset_id) {
      var payload = {};
      try {
        const onlyInputs = document.querySelectorAll('#edit input[type="text"]');
        const formData = new FormData()
        formData.append("project_id", project_id)
		formData.append("dataset_id", dataset_id)
        onlyInputs.forEach(input => {
          if(input.value != "")
          {
			console.log(JSON.stringify(input.name), input.value);
            formData.append(input.name, input.value);
          }}
          ); 

        formData.forEach((value, key) => {payload[key] = value;});     
        console.log(payload)
        patchDataset_status = await ProjectEditDataset(project_id, dataset_id, payload);
        dataset = patchDataset_status[0]
		if (patchDataset_status[1] === 200) {

          Swal.fire(
		  'Dataset updated!',
		  'success'
          )
        }
       // alert(JSON.stringify(newJob)) 

      }
      catch (e) {
        alert(JSON.stringify(e)) 
      }
    };
</script>

<div class="container mt-3">

	<div class="row">
		<div class="col" >
	<ul class="list-group" style="padding-top:5%;">
		<li class="list-group-item">Id: {dataset.id}</li>
		<li class="list-group-item">Name: {dataset.name}</li>
		<li class="list-group-item">Type: {dataset.type}</li>
    </ul>
    </div>

		<div class="col d-flex align-items-center justify-content-center" >
				<button type="button" style="min-height: 1vh;" 
				class="material-icons text-info" 
				data-bs-toggle="modal" data-bs-target="#dataset{dataset.id}">
				  Edit {dataset.id}
				  </button>
			  
				  <div class="modal fade" id="dataset{dataset.id}" tabindex="-1" 
				  aria-labelledby="dataset{dataset.id}Label" aria-hidden="true">
			  
					  <div class="modal-dialog">
					  <div class="modal-content">

						  <div class="modal-header">
						  <h5 class="modal-title" 
						  id="#dataset{dataset.id}Label">Edit {dataset.name}</h5>
						  <button type="button" class="btn-close" 
						  data-bs-dismiss="modal" aria-label="Close"></button>
			  
						  </div>
						  <div class="modal-body">
							<form id="edit" name="edit" class="flex mx-auto col-6">
				  
			  
							  <div class="mb-3">
								<label for="name" class="form-label">Name</label>
								<input type="text" class="form-control" id="name" name="name"
								>
							  </div>
							  <div class="mb-3">
								<label for="type" class="form-label">Type</label>
								<input type="text" class="form-control" id="type" name="type"
								>
							  </div>
							</form>
							<div class="modal-footer">
			  
							<button type="button" class="btn btn-primary btn-sm" on:click|preventDefault={editDataset(projectId, dataset.id)}>Edit</button>
			  
						  <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
						</div>
						</div>
					  </div>
					</div>
			
		</div>
    </div>


	<div class="accordion" id="accordionResource" style="padding-bottom:2%">
		<div class="accordion-item">
		  <h2 class="accordion-header" id="headingOne">
			<button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#resource-list" aria-expanded="true" aria-controls="resource-list">
				Resources
			</button>
		  </h2>

		<div id="resource-list" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#accordionResource">
			<div class="accordion-body">
			{#if dataset.resource_list.length != 0}
				<table class="table table-bordered">
					<thead>
					<tr>
						<th scope="col">ID</th>
						<th scope="col">Path</th>
						<th scope="col">Pattern</th>
						<th scope="col">Actions</th>
					</tr>
					</thead>
					<tbody>
				{#each dataset.resource_list as r}
					<Resource 			
					{projectId}
					datasetId={dataset.id} 
					bind:resource={r} resource_list={dataset.resource_list}/>
				{/each}
		        	</tbody>
	    	 </table>
	
			{:else}
				<p>no resources yet</p>
			{/if}
			<ResourceAdd 
			 {projectId}
			 datasetId={dataset.id}
			 bind:resource_list={dataset.resource_list}
		 />
		 </div>
		</div>
		</div>
	</div>

	</div>
</div>
