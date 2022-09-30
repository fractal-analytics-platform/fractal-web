<script>
	export let resource;
</script>


<tr>
	<th scope="row">{resource.id}</th>
	<td>{resource.path}</td>
	<td>*.{resource.glob_pattern}</td>
	<td>
		<div class="d-flex">
		<div ><button type="button" class="btn" >
			<i class="material-icons text-danger">Delete</i>
		</button></div>
	
		<div ><button type="button" class="btn" >
			<i class="material-icons text-info">Edit</i>
		</button></div>
	</div>
	</td>
</tr>


