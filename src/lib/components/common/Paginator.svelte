<script>
	/**
	 * Maximum number of pages to be displayed on one side before displaying ellipsis (...)
	 */
	const maxPagesPerSide = 3;
	const availablePageSizes = [10, 20, 50, 100, 500];

	/**
	 * @typedef {Object} Props
	 * @property {(currentPage: number, pageSize: number) => Promise<void>} onPageChange
	 * @property {any} pageSize
	 * @property {any} totalCount
	 * @property {any} currentPage
	 * @property {boolean} [singleLine]
	 */

	/** @type {Props} */
	let {
		onPageChange,
		pageSize = $bindable(),
		totalCount,
		currentPage = $bindable(),
		singleLine = false
	} = $props();

	/**
	 * @param {number} newCurrentPage
	 */
	async function setCurrentPage(newCurrentPage) {
		await onPageChange(newCurrentPage, pageSize);
		fixCurrentPageFocus();
	}

	async function setPageSize() {
		currentPage = 1;
		await onPageChange(currentPage, pageSize);
		fixCurrentPageFocus();
	}

	/**
	 * The focus of the current page button may be set on the wrong item due to the redrawing
	 * of the component. This function force setting the focus to the correct active button.
	 */
	function fixCurrentPageFocus() {
		const activeItem = document.querySelector('.pagination .page-item.active button');
		if (activeItem instanceof HTMLButtonElement) {
			activeItem.focus();
		}
	}

	/**
	 * @param {number} selectedPage
	 * @param {number} totalPages
	 */
	function getPageNumbers(selectedPage, totalPages) {
		/** @type {Array<number| string>} */
		const pageNumbers = [];
		if (selectedPage - maxPagesPerSide <= 1) {
			for (let i = 1; i <= selectedPage; i++) {
				pageNumbers.push(i);
			}
		} else {
			pageNumbers.push(1);
			if (selectedPage - maxPagesPerSide !== 2) {
				pageNumbers.push('...');
			}
			for (let i = selectedPage - maxPagesPerSide; i <= selectedPage; i++) {
				pageNumbers.push(i);
			}
		}
		if (selectedPage + maxPagesPerSide >= totalPages) {
			for (let i = selectedPage + 1; i <= totalPages; i++) {
				pageNumbers.push(i);
			}
		} else {
			let i;
			for (i = selectedPage + 1; i <= selectedPage + maxPagesPerSide; i++) {
				pageNumbers.push(i);
			}
			if (i !== totalPages) {
				pageNumbers.push('...');
			}
			pageNumbers.push(totalPages);
		}
		return pageNumbers;
	}
	let numberOfPages = $derived(Math.ceil(totalCount / pageSize));
	let pageNumbers = $derived(getPageNumbers(currentPage, numberOfPages));
</script>

<div class="row">
	<div class={singleLine ? 'col-6' : 'col-12'}>
		<div class="justify-content-center" class:row={!singleLine}>
			{#if numberOfPages > 1}
				<div class="col">
					<nav aria-label="Page navigation">
						<ul class="pagination justify-content-center">
							<li class="page-item">
								<button
									class="page-link"
									type="button"
									aria-label="Previous"
									disabled={currentPage === 1}
									onclick={() => setCurrentPage(currentPage - 1)}
									class:disabled={currentPage === 1}
								>
									<span aria-hidden="true">&laquo;</span>
								</button>
							</li>
							{#each pageNumbers as pageNumber, index (index)}
								{#if typeof pageNumber === 'number'}
									<li class="page-item" class:active={pageNumber === currentPage}>
										<button
											type="button"
											class="page-link"
											onclick={() => setCurrentPage(/** @type {number} */ (pageNumber))}
										>
											{pageNumber}
										</button>
									</li>
								{:else}
									<li class="page-item">
										<span class="page-link disabled">{pageNumber}</span>
									</li>
								{/if}
							{/each}
							<li class="page-item">
								<button
									class="page-link"
									type="button"
									aria-label="Next"
									disabled={currentPage === numberOfPages}
									onclick={() => setCurrentPage(currentPage + 1)}
									class:disabled={currentPage === numberOfPages}
								>
									<span aria-hidden="true">&raquo;</span>
								</button>
							</li>
						</ul>
					</nav>
				</div>
			{/if}
		</div>
	</div>
	<div class={singleLine ? 'col-6' : 'col-12'}>
		<div class="row row-cols-lg-auto justify-content-center">
			<div class="col-6">
				<div class="input-group">
					<label class="input-group-text" for="page_size">Page size</label>
					<select
						class="form-select"
						id="page_size"
						bind:value={pageSize}
						onchange={() => setPageSize()}
					>
						{#each availablePageSizes as pageSize (pageSize)}
							<option value={pageSize}>{pageSize}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="col-6 mt-2">
				<p class="text-center">Total results: {totalCount}</p>
			</div>
		</div>
	</div>
</div>
