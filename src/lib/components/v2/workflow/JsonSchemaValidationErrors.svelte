<script>
	/**
	 * @typedef {Object} Props
	 * @property {import('ajv').ErrorObject[] | undefined} validationErrors
	 * @property {string} title
	 */

	/** @type {Props} */
	let { validationErrors, title } = $props();
</script>

{#if validationErrors}
	<div class="alert alert-danger">
		<p>{title}</p>
		<ul id="validation-errors">
			{#each validationErrors as error, index (index)}
				<li>
					{#if error.instancePath !== ''}
						{error.instancePath}:
					{/if}
					{#if error.keyword === 'additionalProperties'}
						must NOT have additional property '{error.params.additionalProperty}'
					{:else}
						{error.message}
					{/if}
					<small
						data-bs-toggle="collapse"
						data-bs-target="#collapse-{index}"
						aria-expanded="true"
						aria-controls="collapse-{index}"
						class="text-primary"
						role="button"
					>
						more
					</small>
					<div
						id="collapse-{index}"
						class="accordion-collapse collapse"
						data-bs-parent="#validation-errors"
					>
						<div class="accordion-body">
							<pre class="alert alert-warning mt-1">{JSON.stringify(error, null, 2)}</pre>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</div>
{/if}
