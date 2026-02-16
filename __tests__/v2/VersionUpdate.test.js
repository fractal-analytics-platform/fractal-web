import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// Mocking the page store
vi.mock('$app/state', () => {
	return {
		page: {
			params: {
				projectId: 1
			}
		}
	};
});

// Mocking fetch
global.fetch = vi.fn();

function createFetchResponse(data) {
	return {
		ok: true,
		json: () => new Promise((resolve) => resolve(data))
	};
}

// The component to be tested must be imported after the mock setup
import VersionUpdate from '../../src/lib/components/v2/workflow/VersionUpdate.svelte';
import { writable } from 'svelte/store';

const newArgsSchema = {
	title: 'MyTask',
	type: 'object',
	properties: {
		changed_property: {
			type: 'boolean'
		},
		new_property: {
			type: 'string'
		}
	},
	required: ['changed_property', 'new_property'],
	additionalProperties: false
};

const taskGroups = /** @type {import('fractal-components/types/api').TaskGroupV2[]} */ ([
	{
		id: 1,
		pkg_name: 'group1',
		version: '1.2.3',
		task_list: [
			{
				id: 1,
				name: 'My Task',
				version: '1.2.3',
				type: 'non_parallel',
				args_schema_non_parallel: {},
				args_schema_parallel: null,
				taskgroupv2_id: 1
			}
		],
		active: true
	},
	{
		id: 2,
		pkg_name: 'group1',
		version: '1.2.4',
		task_list: [
			{
				id: 2,
				name: 'My Task',
				version: '1.2.4',
				type: 'non_parallel',
				args_schema_non_parallel: {},
				args_schema_parallel: null,
				taskgroupv2_id: 2
			}
		],
		active: true
	},
	{
		id: 3,
		pkg_name: 'group1',
		version: '2.0.0',
		task_list: [
			{
				id: 3,
				name: 'My Task',
				version: '2.0.0',
				type: 'non_parallel',
				args_schema_non_parallel: newArgsSchema,
				args_schema_parallel: null,
				taskgroupv2_id: 3
			}
		],
		active: true
	},
	{
		id: 4,
		pkg_name: 'group1',
		version: '2.5.0',
		task_list: [
			{
				id: 3,
				name: 'My Task',
				version: '2.5.0',
				type: 'compound',
				args_schema_non_parallel: {},
				args_schema_parallel: {},
				taskgroupv2_id: 4
			}
		],
		active: true
	},
	{
		id: 5,
		pkg_name: 'group1',
		version: '1.2.3',
		task_list: [
			{
				id: 5,
				name: 'My Other Task',
				version: '1.2.3',
				type: 'parallel',
				args_schema_non_parallel: null,
				args_schema_parallel: {},
				taskgroupv2_id: 5
			}
		],
		active: true
	},
	{
		id: 6,
		pkg_name: 'group1',
		version: '1.3.0',
		task_list: [
			{
				id: 6,
				name: 'My Other Task',
				version: '1.3.0',
				type: 'parallel',
				args_schema_non_parallel: null,
				args_schema_parallel: {},
				taskgroupv2_id: 6
			}
		],
		active: true
	},
	{
		id: 7,
		pkg_name: 'group1',
		version: null,
		task_list: [
			{
				id: 7,
				name: 'null version task',
				version: null,
				type: 'parallel',
				args_schema_non_parallel: null,
				args_schema_parallel: {},
				taskgroupv2_id: 7
			}
		],
		active: true
	},
	{
		id: 8,
		pkg_name: 'group1',
		version: '1.5.0',
		task_list: [
			{
				id: 8,
				name: 'no args schema task',
				version: '1.5.0',
				type: 'parallel',
				args_schema_non_parallel: null,
				args_schema_parallel: null,
				taskgroupv2_id: 8
			}
		],
		active: true
	},
	{
		id: 9,
		pkg_name: 'default_values',
		version: '0.0.1',
		task_list: [
			{
				id: 9,
				name: 'task_default_values',
				version: '0.0.1',
				type: 'non_parallel',
				args_schema_non_parallel: {
					title: 'task_default_values',
					type: 'object',
					properties: {
						default_boolean1: {
							type: 'boolean',
							default: false
						}
					},
					additionalProperties: false
				},
				args_schema_parallel: null,
				taskgroupv2_id: 9
			}
		],
		active: true
	},
	{
		id: 10,
		pkg_name: 'default_values',
		version: '0.0.2',
		task_list: [
			{
				id: 10,
				name: 'task_default_values',
				version: '0.0.2',
				type: 'non_parallel',
				args_schema_non_parallel: {
					title: 'task_default_values',
					type: 'object',
					properties: {
						default_boolean1: {
							type: 'boolean',
							default: false
						},
						default_boolean2: {
							type: 'boolean',
							default: true
						},
						default_string: {
							type: 'string',
							default: 'foo'
						}
					},
					additionalProperties: false
				},
				args_schema_parallel: null,
				taskgroupv2_id: 10
			}
		],
		active: true
	},
	{
		id: 11,
		pkg_name: 'test_converter_compound',
		version: '1.4.2',
		task_list: [
			{
				id: 11,
				name: 'test_converter_compound',
				version: '1.4.2',
				type: 'compound',
				args_schema_non_parallel: {},
				args_schema_parallel: {},
				taskgroupv2_id: 11
			}
		],
		active: true
	},
	{
		id: 12,
		pkg_name: 'test_converter_compound',
		version: '1.5.0',
		task_list: [
			{
				id: 12,
				name: 'test_converter_compound',
				version: '1.5.0',
				type: 'converter_compound',
				args_schema_non_parallel: {},
				args_schema_parallel: {},
				taskgroupv2_id: 12
			}
		],
		active: true
	},
	{
		id: 13,
		pkg_name: 'test_converter_non_parallel',
		version: '1.4.2',
		task_list: [
			{
				id: 13,
				name: 'test_converter_non_parallel',
				version: '1.4.2',
				type: 'non_parallel',
				args_schema_non_parallel: {},
				args_schema_parallel: null,
				taskgroupv2_id: 13
			}
		],
		active: true
	},
	{
		id: 14,
		pkg_name: 'test_converter_non_parallel',
		version: '1.5.0',
		task_list: [
			{
				id: 14,
				name: 'test_converter_non_parallel',
				version: '1.5.0',
				type: 'converter_non_parallel',
				args_schema_non_parallel: {},
				args_schema_parallel: null,
				taskgroupv2_id: 14
			}
		],
		active: true
	}
]);

/**
 * @param {import('fractal-components/types/api').TaskV2} task
 */
function mockTaskRequest(task) {
	/** @type {import('vitest').Mock} */ (fetch).mockResolvedValue(createFetchResponse(task));
}

/**
 * @param {string} name
 * @param {string|null} version
 * @returns {import('fractal-components/types/api').TaskV2}
 */
function getTask(name, version) {
	const taskGroup = taskGroups.find(
		(tg) => tg.version === version && tg.task_list.find((t) => t.name === name)
	);
	return /** @type {import('fractal-components/types/api').TaskV2} */ (
		/** @type {import('fractal-components/types/api').TaskGroupV2} */ (taskGroup).task_list.find(
		(t) => t.name === name
	)
	);
}

function getMockedWorkflowTask() {
	/** @type {unknown} */
	const wft = {
		args_non_parallel: null,
		args_parallel: null
	};
	return /** @type {import('fractal-components/types/api').WorkflowTaskV2} */ (wft);
}

describe('VersionUpdate', () => {
	beforeEach(() => {
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
	});

	it('update task with compatible arguments', async () => {
		const user = userEvent.setup();
		const task = getTask('My Task', '1.2.3');
		const newTask = getTask('My Task', '1.2.4');
		mockTaskRequest(newTask);
		const versions = /** @type {string[]} */ (
			await checkVersions(task, 2, getMockedWorkflowTask(), [
				{ task_id: 3, version: '2.0.0' },
				{ task_id: newTask.id, version: newTask.version }
			])
		);
		expect(versions[0]).toBe('2.0.0');
		expect(versions[1]).toBe('1.2.4');

		await user.selectOptions(screen.getByRole('combobox'), '1.2.4');

		expect(screen.queryByText(/The old arguments are not compatible with the new schema/)).null;

		await user.click(screen.getByRole('button', { name: 'Update' }));
	});

	it('update task with non compatible arguments', async () => {
		const user = userEvent.setup();
		const task = getTask('My Task', '1.2.4');
		const newTask = getTask('My Task', '2.0.0');
		mockTaskRequest(newTask);
		const versions = /** @type {string[]} */ (
			await checkVersions(
				task,
				1,
				{
					...getMockedWorkflowTask(),
					args_non_parallel: { extra_property: 1, changed_property: 'x' }
				},
				[{ task_id: newTask.id, version: newTask.version }]
			)
		);
		expect(versions[0]).toBe('2.0.0');

		await user.selectOptions(screen.getByRole('combobox'), '2.0.0');

		expect(screen.getByText(/The old arguments are not compatible with the new schema/)).toBeVisible();

		await user.click(screen.getByRole('button', { name: 'Update' }));
	});

	it('no new versions available', async () => {
		const task = getTask('My Other Task', '1.3.0');
		await checkVersions(task, 0, getMockedWorkflowTask(), []);
	});

	it('display warning if task has no version', () => {
		renderVersionUpdate(getTask('null version task', null), getMockedWorkflowTask(), []);
		expect(
			screen.getByText(
				'It is not possible to check for new versions because task version is not set.'
			)
		).toBeDefined();
	});

	it('display warning if task has no args_schema', () => {
		renderVersionUpdate(getTask('no args schema task', '1.5.0'), getMockedWorkflowTask(), []);
		expect(
			screen.getByText(
				'It is not possible to check for new versions because task has no args_schema.'
			)
		).toBeDefined();
	});

	it('update compound to converter_compound', async () => {
		const user = userEvent.setup();
		const task = getTask('test_converter_compound', '1.4.2');
		const newTask = getTask('test_converter_compound', '1.5.0');
		mockTaskRequest(newTask);
		const versions = /** @type {string[]} */ (
			await checkVersions(
				task,
				1,
				{
					...getMockedWorkflowTask(),
					...{
						args_non_parallel: {},
						args_parallel: {}
					}
				},
				[{ task_id: newTask.id, version: newTask.version }]
			)
		);
		expect(versions[0]).toBe('1.5.0');

		await user.selectOptions(screen.getByRole('combobox'), '1.5.0');

		await user.click(screen.getByRole('button', { name: 'Update' }));

		expect(fetch).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining('/wftask/replace-task'),
			expect.objectContaining({
				body: JSON.stringify({
					args_non_parallel: {},
					args_parallel: {}
				})
			})
		);
	});

	it('update non_parallel to converter_non_parallel', async () => {
		const user = userEvent.setup();
		const task = getTask('test_converter_non_parallel', '1.4.2');
		const newTask = getTask('test_converter_non_parallel', '1.5.0');
		mockTaskRequest(newTask);
		const versions = /** @type {string[]} */ (
			await checkVersions(
				task,
				1,
				{
					...getMockedWorkflowTask(),
					...{
						args_non_parallel: {}
					}
				},
				[{ task_id: newTask.id, version: newTask.version }]
			)
		);
		expect(versions[0]).toBe('1.5.0');

		await user.selectOptions(screen.getByRole('combobox'), '1.5.0');

		await user.click(screen.getByRole('button', { name: 'Update' }));

		expect(fetch).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining('/wftask/replace-task'),
			expect.objectContaining({
				body: JSON.stringify({
					args_non_parallel: {},
					args_parallel: null
				})
			})
		);
	});
});

/**
 * @param {import('fractal-components/types/api').TaskV2} task
 * @param {number} expectedCount
 * @param {import('fractal-components/types/api').WorkflowTaskV2} workflowTask
 * @param {Array<{ task_id: number, version: string }>} updateCandidates
 * @returns {Promise<string[]|undefined>}
 */
async function checkVersions(task, expectedCount, workflowTask, updateCandidates) {
	const result = renderVersionUpdate(task, workflowTask, updateCandidates);

	// triggers the updates
	await new Promise((resolve) => setTimeout(resolve));

	if (expectedCount === 0) {
		expect(result.getByText('No new versions available')).toBeDefined();
		return;
	}

	const options = result.getAllByRole('option');
	expect(options.length).toBe(expectedCount + 1);
	expect(/** @type {HTMLOptionElement} **/(options[0]).value).toBe('');
	return options.filter((_, i) => i > 0).map((o) => /** @type {HTMLOptionElement} **/(o).value);
}

/**
 * @param {import('fractal-components/types/api').TaskV2} task
 * @param {import('fractal-components/types/api').WorkflowTaskV2} workflowTask
 * @param {Array<{ task_id: number, version: string }>} updateCandidates
 * @returns
 */
function renderVersionUpdate(task, workflowTask, updateCandidates) {
	workflowTask.task = task;
	const nop = async function () { };
	return render(VersionUpdate, {
		props: {
			workflowTask,
			updateCandidates,
			updateWorkflowCallback: nop,
			newVersionsCount: writable(0)
		}
	});
}
