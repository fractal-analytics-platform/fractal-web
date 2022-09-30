<script>
	export let dataset;
	export let projectId;
  import ResourceAdd from "$lib/ResourceAdd.svelte";
  import Resource from "$lib/Resource.svelte";
</script>

<div class="container mt-3">

	<div class="row">
		<div class="col">
	<ul class="list-group" style="padding-top:5%;">
		<li class="list-group-item">Id: {dataset.id}</li>
		<li class="list-group-item">Name: {dataset.name}</li>
		<li class="list-group-item">Type: {dataset.type}</li>
    </ul>
        </div>
		<div class="col">
			<div class="d-flex">
				<div ><button type="button" class="btn" >
					<i class="material-icons text-danger">Delete {dataset.name}</i>
				</button></div>
			
				<div ><button type="button" class="btn" >
					<i class="material-icons text-info">Edit {dataset.name}</i>
				</button></div>
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
					<Resource bind:resource={r} />
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

