<script>
	/**
	 * @typedef {Object} Props
	 * @property {string[]} emailList
	 * @property {number | undefined} queryTemplateId
	 * @property {boolean} queryIsOwner
	 * @property {string | undefined} queryUserEmail
	 * @property {string | undefined} queryName
	 * @property {number | undefined} queryVersion
	 * @property {() => void} onSubmit
	 */

	let {
		emailList,
		queryTemplateId = $bindable(),
		queryIsOwner = $bindable(),
		queryUserEmail = $bindable(),
		queryName = $bindable(),
		queryVersion = $bindable(),
		onSubmit
	} = $props();
</script>


<div class="card mb-3">
	<div class="card-header bg-light fw-semibold">
		Filter options
	</div>

	<div class="card-body">
		<div class="row g-3 align-items-end">

			<div class="col-md">
				<label class="form-label small text-muted">Template ID</label>
				<input
					type="number"
					class="form-control form-control-sm"
					bind:value={queryTemplateId}
				/>
			</div>

			<div class="col-md">
				<label class="form-label small text-muted">Name</label>
				<input
					type="text"
					class="form-control form-control-sm"
					bind:value={queryName}
				/>
			</div>

			<div class="col-md">
				<label class="form-label small text-muted">User email</label>
				<select
					class="form-select form-select-sm"
					bind:value={queryUserEmail}
				>
					<option value={undefined}>All users</option>
					{#each emailList as email}
						<option value={email}>{email}</option>
					{/each}
				</select>
			</div>

			<div class="col-md">
				<label class="form-label small text-muted">Version</label>
				<input
					type="number"
					class="form-control form-control-sm"
					bind:value={queryVersion}
				/>
			</div>

			<div class="col-md-auto">
				<div class="form-check mt-4 pt-1">
					<input
						id="isOwnerCheckbox"
						type="checkbox"
						class="form-check-input"
						bind:checked={queryIsOwner}
					/>
					<label
						class="form-check-label small"
						for="isOwnerCheckbox"
					>
						Is owner
					</label>
				</div>
			</div>

			<div class="col-md-auto">
				<button
					class="btn btn-warning btn-sm px-4"
					onclick={onSubmit}
				>
					Apply
				</button>
			</div>

		</div>
	</div>
</div>