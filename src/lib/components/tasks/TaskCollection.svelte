<script>
  import { browser } from '$app/environment'
  import { enhance } from '$app/forms'
  import { page } from '$app/stores'

  // This component, when receives a collectTaskAction successful result
  // should store in local storage the collection request id
  // successive reloads of the list of collection requests shall update
  // the status of collections
  // List of collection status:
  // -  installing
  // -  collecting
  // -  fail
  // -  ok
  // If a collection status is ok, the component shall remove the collection
  // request from the localStorage
  // If a collection status is fail, the component shall request the logs
  // If a collection status is collecting, the component shall fetch update
  // If a collection status is installing, the component shall fetch update

</script>

<p>Task collection component</p>

<form method="post" action="?/collectTask" use:enhance>
  <div class="row g-3">
    <div class="col-6">
      <div class="input-group">
        <div class="input-group-text">
          <span class="font-monospace">Package</span>
        </div>
        <input name="package" type="text" class="form-control" required>
      </div>
    </div>
    <div class="col-6">
      <div class="input-group">
        <div class="input-group-text">
          <span class="font-monospace">Version</span>
        </div>
        <input name="version" type="text" class="form-control">
      </div>
    </div>
    <div class="col-6">
      <div class="input-group">
        <div class="input-group-text">
          <span class="font-monospace">Python Version</span>
        </div>
        <input name="python_version" type="text" class="form-control">
      </div>
    </div>
    <div class="col-6">
      <div class="input-group">
        <div class="input-group-text">
          <span class="font-monospace">Package extras</span>
        </div>
        <input name="package_extras" type="text" class="form-control">
      </div>
    </div>
    <div class="col-auto">
      <button type="submit" class="btn btn-primary">Collect</button>
    </div>
  </div>
</form>
