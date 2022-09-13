<script>
	export let resource;
</script>

<div>
	<h4>id: {resource.id}</h4>
	<p>Path: {resource.path}</p>
	<p>Glob pattern: {resource.glob_pattern}</p>
	<button>Edit resource</button>
	<button>Delete resource</button>
	<hr />
</div>

