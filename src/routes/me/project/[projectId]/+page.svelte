<script>
  import Project from "$lib/Project.svelte";
  export let data;
</script>

<Project bind:project={data.project} />
