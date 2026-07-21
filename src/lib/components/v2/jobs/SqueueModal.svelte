<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';

	/** @type {Modal|undefined} */
	let modal = $state();
	let scope = $state('all');
	let output = $state('');
	let loading = $state(false);

	async function getSqueue() {
		output = '';
		loading = true;
		modal?.hideErrorAlert();
		const response = await fetch(`/api/v2/job/squeue?scope=${scope}`);
		if (response.ok) {
			output = await response.text();
		} else {
			const error = await getAlertErrorFromResponse(response);
			modal?.displayErrorAlert(error);
		}
		loading = false;
	}
</script>

<Modal id="squeueModal" size="xl" bind:this={modal} onOpen={getSqueue}>
	{#snippet header()}
		<h1 class="modal-title fs-5">Cluster queue</h1>
	{/snippet}
	{#snippet body()}
		<div class="row mb-3">
			<div class="col-md-6">
				<div class="form-check form-check-inline">
					<input
						class="form-check-input"
						type="radio"
						name="scopeSelector"
						id="scopeAllSelector"
						value="all"
						bind:group={scope}
						onchange={() => getSqueue()}
					/>
					<label class="form-check-label" for="scopeAllSelector">all</label>
				</div>
				<div class="form-check form-check-inline">
					<input
						class="form-check-input"
						type="radio"
						name="scopeSelector"
						id="scopeUserSelector"
						value="user"
						bind:group={scope}
						onchange={() => getSqueue()}
					/>
					<label class="form-check-label" for="scopeUserSelector">user</label>
				</div>
				<div class="form-check form-check-inline">
					<input
						class="form-check-input"
						type="radio"
						name="scopeSelector"
						id="scopeAccountsSelector"
						value="accounts"
						bind:group={scope}
						onchange={() => getSqueue()}
					/>
					<label class="form-check-label" for="scopeAccountsSelector">accounts</label>
				</div>
			</div>
		</div>

		<div id="errorAlert-squeueModal"></div>

		{#if loading}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"> </span>
		{:else if output}
			<p>Output of <code>squeue</code> command:</p>
			<div>
				<pre>{output}</pre>
			</div>
		{/if}
	{/snippet}
</Modal>
