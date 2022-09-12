<script>
  import Project from "$lib/Project.svelte";
  import { ProjectGet } from "$lib/Project.js";
  import { error } from "@sveltejs/kit";
  import { onMount } from "svelte";

  let project;
  export let data;

  onMount(
    async () => {
      console.log("dioporco");
      	try {
		project = await ProjectGet(data.projectId);
	}
	catch (e) {
		throw error(e.status, e.detail + " " + e.url);
	}

    }
  );

</script>

<Project bind:project={data.project} />
