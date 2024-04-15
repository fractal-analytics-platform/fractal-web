<script>
	/**
	 * Maximum number of pages to be displayed on one side before displaying ellipsis (...)
	 */
	const maxPagesPerSide = 3;
	const availablePageSizes = [10, 20, 50, 100, 500];

	/** @type {(currentPage: number, pageSize: number) => Promise<void>} */
	export let onPageChange;
	export let pageSize;
	export let totalCount;
	export let currentPage;

	$: numberOfPages = Math.ceil(totalCount / pageSize);
	$: pageNumbers = getPageNumbers(currentPage, numberOfPages);

	/**
	 * @param {number} newCurrentPage
	 */
	function setCurrentPage(newCurrentPage) {
		onPageChange(newCurrentPage, pageSize);
	}

	function setPageSize() {
		currentPage = 1;
		onPageChange(currentPage, pageSize);
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
</script>

<div class="row row-cols-lg-auto justify-content-center">
	{#if totalCount > 0}
		<div class="col-12">
			<nav aria-label="Page navigation">
				<ul class="pagination justify-content-center">
					<li class="page-item">
						<button
							class="page-link"
							type="button"
							aria-label="Previous"
							disabled={currentPage === 1}
							on:click={() => setCurrentPage(currentPage - 1)}
							class:disabled={currentPage === 1}
						>
							<span aria-hidden="true">&laquo;</span>
						</button>
					</li>
					{#each pageNumbers as pageNumber}
						{#if typeof pageNumber === 'number'}
							<li class="page-item" class:active={pageNumber === currentPage}>
								<button
									type="button"
									class="page-link"
									on:click={() => setCurrentPage(/** @type {number} */ (pageNumber))}
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
							on:click={() => setCurrentPage(currentPage + 1)}
							class:disabled={currentPage === numberOfPages}
						>
							<span aria-hidden="true">&raquo;</span>
						</button>
					</li>
				</ul>
			</nav>
		</div>
		<div class="col-12">
			<div class="input-group mb-1">
				<label class="input-group-text" for="page_size">Page size</label>
				<select
					class="form-control"
					id="page_size"
					bind:value={pageSize}
					on:change={() => setPageSize()}
				>
					{#each availablePageSizes as pageSize}
						<option value={pageSize}>{pageSize}</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}
</div>
<div class="row">
	<div class="mt-1 col">
		<p class="text-center">Total results: {totalCount}</p>
	</div>
</div>
