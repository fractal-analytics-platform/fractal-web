<script>
  import { page } from '$app/stores'
  // import { getWorkflow } from '$lib/api/v1/workflow/workflow_api'
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
    <li class="breadcrumb-item">
      {$page.params.workflowId}
    </li>
  </ol>
</nav>

<h1>Workflow - {$page.params.workflowId}</h1>