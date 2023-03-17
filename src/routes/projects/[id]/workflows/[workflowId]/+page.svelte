<script>
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { getWorkflow } from '$lib/api/v1/workflow/workflow_api'

  let workflow = undefined

  onMount(async () => {
    workflow = await getWorkflow($page.params.workflowId)
      .catch(error => {
        console.error(error)
      })
  })
</script>

<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item" aria-current="page">
      <a href="/projects">Projects</a>
    </li>
    {#if $page.params.id}
      <li class="breadcrumb-item" aria-current="page">
        <a href="/projects/{$page.params.id}">{$page.params.id}</a>
      </li>
    {/if}
    <li class="breadcrumb-item">
      Workflows
    </li>
    {#if workflow }
    <li class="breadcrumb-item active">
      { workflow.name }
    </li>
    {/if}
  </ol>
</nav>

{#if workflow }
  <h1>Workflow {workflow.name} #{$page.params.workflowId}</h1>
{/if}