<script>
  import { page } from "$app/stores";
  import Project from "$lib/Project.svelte"
  export async function load({ data, fetch }) {
    // const res = await fetch(
    // 	"http://127.0.0.1:8000/api/v1/project/",
    // 	{credentials: "include"}
    // );

    // if (res.ok) {
    // 	return { props: {projects: await res.json()}};
    // }
    console.log("diocane");

    let arr = [0, 1, 2];
    return {
      data: {projects: arr}
    };
  };

  export let projects;

  console.log("Projects:");
  console.log(projects);
</script>

{#if projects}
<h3>Project List to become </h3>
  {#each projects as p}
    <Project project={p} />
  {/each}
{/if}
