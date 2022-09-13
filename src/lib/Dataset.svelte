<script>
	export let dataset;
	export let projectId;
  import ResourceAdd from "$lib/ResourceAdd.svelte";
  import Resource from "$lib/Resource.svelte";
</script>

<li>
	<div>
		<p>{dataset.name} ({dataset.id})</p>
		<p>type: {dataset.type}</p>
		<h4>Resources</h4>
		<div id="resource-list">
			{#if dataset.resource_list.length != 0}
				{#each dataset.resource_list as r}
					<Resource bind:resource={r} />
				{/each}
			{:else}
				<p>no resources yet</p>
			{/if}
			<ResourceAdd 
			 {projectId}
			 datasetId={dataset.id}
			 bind:resource_list={dataset.resource_list}
		 />
		</div>
		<button>Edit dataset</button>
		<button>Delete dataset</button>
	</div>
</li>

<style>
  #resource-list {
    padding: 1rem;
    box-shadow: -0px 0px 11px 0px #898989;
    margin: 20px;
  }
</style>
