<script>
	/** @type {Array<{ key: string, value: boolean, error: string }>} */
	let inputTypesArray = $state([]);
	/** @type {Array<{ key: string, value: boolean, error: string }>} */
	let outputTypesArray = $state([]);

	/**
	 * @returns {boolean}
	 */
	export function validate() {
		inputTypesArray = validateTypes(inputTypesArray);
		outputTypesArray = validateTypes(outputTypesArray);
		return !typesHaveErrors(inputTypesArray) && !typesHaveErrors(outputTypesArray);
	}

	/**
	 * @param {{ [key: string]: boolean }} inputTypes
	 * @param {{ [key: string]: boolean }} outputTypes
	 */
	export function init(inputTypes, outputTypes) {
		inputTypesArray = getArrayFromTypes(inputTypes);
		outputTypesArray = getArrayFromTypes(outputTypes);
	}

	/**
	 * @returns {{ [key: string]: boolean }}
	 */
	export function getInputTypes() {
		return getTypesFromArray(inputTypesArray);
	}

	/**
	 * @returns {{ [key: string]: boolean }}
	 */
	export function getOutputTypes() {
		return getTypesFromArray(outputTypesArray);
	}

	/**
	 * @param {{ [key: string]: boolean }} types
	 * @returns {Array<{ key: string, value: boolean, error: string }>}
	 */
	function getArrayFromTypes(types) {
		return Object.entries(types).map(([key, value]) => ({ key, value, error: '' }));
	}

	/**
	 * @param {Array<{ key: string, value: boolean, error: string }>} items
	 * @returns {Array<{ key: string, value: boolean, error: string }>}
	 */
	function validateTypes(items) {
		const validatedItems = [];
		const keys = [];
		for (const item of items) {
			const validatedItem = { ...item, error: '' };
			if (!item.key) {
				validatedItem.error = 'Key is required';
			} else if (keys.includes(item.key)) {
				validatedItem.error = 'Duplicated key';
			}
			keys.push(item.key);
			validatedItems.push(validatedItem);
		}
		return validatedItems;
	}

	/**
	 * @param {Array<{ key: string, value: boolean, error: string }>} items
	 * @returns {boolean}
	 */
	function typesHaveErrors(items) {
		return items.filter((t) => t.error !== '').length > 0;
	}

	/**
	 * @param {Array<{ key: string, value: boolean, error: string }>} items
	 * @returns {{ [key: string]: boolean }}
	 */
	function getTypesFromArray(items) {
		return Object.fromEntries(items.map((i) => [i.key, i.value]));
	}

	/**
	 * @param {Event} event
	 */
	 function addInputType(event) {
		event.stopPropagation();
		inputTypesArray = [...inputTypesArray, { key: '', value: false, error: '' }];
	}

	/**
	 * @param {Event} event
	 */
	function addOutputType(event) {
		event.stopPropagation();
		outputTypesArray = [...outputTypesArray, { key: '', value: false, error: '' }];
	}

	/**
	 * @param {number} index
	 */
	function removeInputType(index) {
		inputTypesArray = inputTypesArray.filter((_, i) => i !== index);
	}

	/**
	 * @param {number} index
	 */
	function removeOutputType(index) {
		outputTypesArray = outputTypesArray.filter((_, i) => i !== index);
	}
</script>

<div class="mb-2 row">
	<span class="col-2 col-form-label text-end"> Input Types </span>
	{#if inputTypesArray.length > 0}
		<div class="col-7">
			{#each inputTypesArray as inputType, index (index)}
				<div class="row">
					<div class="col">
						<div class="input-group mb-1" class:has-validation={inputType.error}>
							<input
								type="text"
								class="form-control type-filter-key"
								placeholder="Key"
								bind:value={inputType.key}
								class:is-invalid={inputType.error}
							/>
							<div class="input-group-text">
								<label>
									<input
										class="form-check-input me-1"
										type="checkbox"
										bind:checked={inputType.value}
										aria-label="Value for {inputType.key}"
									/>
									{inputType.value}
								</label>
							</div>
							<button
								class="btn btn-outline-danger"
								type="button"
								onclick={() => removeInputType(index)}
								aria-label="Remove input type"
							>
								<i class="bi bi-trash"></i>
							</button>
							{#if inputType.error}
								<div class="invalid-feedback">{inputType.error}</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
	<div class="col-3">
		<button class="btn btn-outline-primary" onclick={addInputType} type="button">
			Add input type
		</button>
	</div>
</div>

<div class="mb-2 row">
	<span class="col-2 col-form-label text-end"> Output Types </span>
	{#if outputTypesArray.length > 0}
		<div class="col-7">
			{#each outputTypesArray as outputType, index (index)}
				<div class="row">
					<div class="col">
						<div class="input-group mb-1" class:has-validation={outputType.error}>
							<input
								type="text"
								class="form-control type-filter-key"
								placeholder="Key"
								bind:value={outputType.key}
								class:is-invalid={outputType.error}
							/>
							<div class="input-group-text">
								<label>
									<input
										class="form-check-input me-1"
										type="checkbox"
										bind:checked={outputType.value}
										aria-label="Value for {outputType.key}"
									/>
									{outputType.value}
								</label>
							</div>
							<button
								class="btn btn-outline-danger"
								type="button"
								onclick={() => removeOutputType(index)}
								aria-label="Remove output type"
							>
								<i class="bi bi-trash"></i>
							</button>
							{#if outputType.error}
								<div class="invalid-feedback">{outputType.error}</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
	<div class="col-3">
		<button class="btn btn-outline-primary" onclick={addOutputType} type="button">
			Add output type
		</button>
	</div>
</div>
