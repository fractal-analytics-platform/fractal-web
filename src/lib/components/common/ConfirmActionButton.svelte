<script>
  import { onMount } from 'svelte'
  export let callbackAction = undefined
  export let style = 'primary'
  export let label = 'Button'
  export let modalId = undefined
  export let message = ''

  onMount(() => {
  })

  const handleCallbackAction = () => callbackAction()

</script>

<div class="modal" id="{modalId}">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5">Confirm action</h1>
        <button class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <p>You're about to:</p>
        <p class="badge bg-{style} fs-6">{message}</p>
        <p>Do you confirm?</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" on:click={handleCallbackAction} data-bs-dismiss="modal">Confirm</button>
      </div>
    </div>
  </div>
</div>

<button class="btn btn-{style}" data-bs-toggle="modal" data-bs-target="#{modalId}" >{label}</button>