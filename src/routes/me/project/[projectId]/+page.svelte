<script>
  import Project from "$lib/Project.svelte";
  export let data;

  console.log(data.project)
</script>

<Project bind:project={data.project} />
