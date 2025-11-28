/**
 * @param {Partial<import('fractal-components/types/api').User & { id: number } & { group_ids_names: [number, string][]}>} fields
 * @returns {import('fractal-components/types/api').User & { id: number } & { group_ids_names: [number, string][]}}
 */
export function mockUser(fields = {}) {
	return {
		id: 1,
		email: 'test@example.com',
		is_superuser: false,
		is_active: true,
		is_verified: true,
		group_ids_names: [],
		oauth_accounts: [],
		profile_id: 1,
		project_dirs: ['/tmp'],
		slurm_accounts: [],
		...fields
	};
}

/**
 * @param {Partial<import('fractal-components/types/api').Group & { user_ids: number[] }>} fields
 * @returns {import('fractal-components/types/api').Group & { user_ids: number[] }}}
 */
export function mockGroup(fields = {}) {
	const group = /** @type {unknown} */ ({
		id: 1,
		...fields
	});
	return /** @type {import('fractal-components/types/api').Group & { user_ids: number[] }} */ (group);
}

/**
 * @param {Partial<import('fractal-components/types/api').TaskV2>} fields
 * @returns {import('fractal-components/types/api').TaskV2}
 */
export function mockTask(fields = {}) {
	const task = /** @type {unknown} */ ({
		id: 1,
		...fields
	});
	return /** @type {import('fractal-components/types/api').TaskV2} */ (task);
}

/**
 * @param {Partial<import('fractal-components/types/api').WorkflowV2>} fields
 * @returns {import('fractal-components/types/api').WorkflowV2}
 */
export function mockWorkflow(fields = {}) {
	const workflow = /** @type {unknown} */ ({
		id: 1,
		task_list: [],
		...fields
	});
	return /** @type {import('fractal-components/types/api').WorkflowV2} */ (workflow);
}

/**
 * @param {Partial<import('fractal-components/types/api').WorkflowTaskV2>} fields
 * @returns {import('fractal-components/types/api').WorkflowTaskV2}
 */
export function mockWorkflowTask(fields = {}) {
	const workflowTask = /** @type {unknown} */ ({
		id: 1,
		task_list: [],
		...fields
	});
	return /** @type {import('fractal-components/types/api').WorkflowTaskV2} */ (workflowTask);
}

/**
 * @param {Partial<import('fractal-components/types/api').DatasetV2>} fields
 * @returns {import('fractal-components/types/api').DatasetV2}
 */
export function mockDataset(fields = {}) {
	const dataset = /** @type {unknown} */ ({
		id: 1,
		...fields
	});
	return /** @type {import('fractal-components/types/api').DatasetV2} */ (dataset);
}

/**
 * @param {Partial<import('fractal-components/types/api').ApplyWorkflowV2>} fields
 * @returns {import('fractal-components/types/api').ApplyWorkflowV2}
 */
export function mockApplyWorkflow(fields = {}) {
	const job = /** @type {unknown} */ ({
		id: 1,
		...fields
	});
	return /** @type {import('fractal-components/types/api').ApplyWorkflowV2} */ (job);
}
