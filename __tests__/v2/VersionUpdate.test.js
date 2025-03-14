import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { readable } from 'svelte/store';

// Mocking the page store
vi.mock('$app/stores', () => {
	return {
		page: readable({
			params: {
				projectId: 1
			}
		})
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

const taskGroups = [
	{
		id: 1,
		pkg_name: 'group1',
		version: '1.2.3',
		task_list: [
			{
				id: 1,
				name: 'My Task',
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
	}
];

function mockTaskGroupsList() {
	fetch.mockResolvedValue(createFetchResponse(taskGroups));
}

function getTask(name, version) {
	const taskGroup = taskGroups.find(
		(tg) => tg.version === version && tg.task_list.find((t) => t.name === name)
	);
	return taskGroup.task_list.find((t) => t.name === name);
}

describe('VersionUpdate', () => {
	beforeEach(() => {
		fetch.mockClear();
	});
	
	it('update task without changing the arguments', async () => {
		const task = getTask('My Task', '1.2.3');
		const versions = await checkVersions(task, 2);
		expect(versions[0]).toBe('2.0.0');
		expect(versions[1]).toBe('1.2.4');

		await fireEvent.change(screen.getByRole('combobox'), { target: { value: '1.2.4' } });

		const btn = screen.getByRole('button', { name: 'Update' });
		expect(btn.disabled).eq(false);
		await fireEvent.click(btn);
	});

	it('update task fixing the arguments', async () => {
		const task = getTask('My Task', '1.2.4');
		const versions = await checkVersions(task, 1, {
			args_non_parallel: { extra_property: 1, changed_property: 'x' },
			args_parallel: null
		});
		expect(versions[0]).toBe('2.0.0');

		await fireEvent.change(screen.getByRole('combobox'), { target: { value: '2.0.0' } });

		const [moreLink1, moreLink2, moreLink3, checkBtn, cancelBtn, updateBtnDisabled] =
			screen.getAllByRole('button');
		expect(moreLink1.textContent).eq('more');
		expect(moreLink2.textContent).eq('more');
		expect(moreLink3.textContent).eq('more');
		expect(checkBtn.textContent).eq('Check');
		expect(cancelBtn.textContent).eq('Cancel');
		expect(updateBtnDisabled.textContent).eq('Update');
		expect(updateBtnDisabled.disabled).eq(true);

		expect(
			screen.getByText('Following errors must be fixed before performing the update:')
		).toBeDefined();

		const list = screen.getAllByRole('listitem');
		expect(list.length).eq(3);
		expect(list[0].textContent).contain("must have required property 'new_property'");
		expect(list[1].textContent).contain("must NOT have additional property 'extra_property'");
		expect(list[2].textContent).contain('/changed_property: must be boolean');

		await fireEvent.input(screen.getByRole('textbox'), {
			target: { value: '{"changed_property": true, "new_property": "test"}' }
		});
		await fireEvent.click(checkBtn);

		const updateBtnEnabled = screen.getAllByRole('button')[2];
		expect(updateBtnEnabled.textContent).eq('Update');
		expect(updateBtnEnabled.disabled).eq(false);
	});

	it('use the cancel button when fixing the arguments', async () => {
		const task = getTask('My Task', '1.2.4');
		const versions = await checkVersions(task, 1, {
			args_non_parallel: { changed_property: 'x' },
			args_parallel: null
		});
		expect(versions[0]).toBe('2.0.0');

		await fireEvent.change(screen.getByRole('combobox'), { target: { value: '2.0.0' } });

		expect(screen.getByRole('textbox').value).eq(
			JSON.stringify({ changed_property: 'x' }, null, 2)
		);

		const cancelBtnDisabled = screen.getByRole('button', { name: 'Cancel' });
		expect(cancelBtnDisabled.disabled).eq(true);

		await fireEvent.input(screen.getByRole('textbox'), {
			target: { value: '{"changed_property": "y"}' }
		});

		const cancelBtnEnabled = screen.getByRole('button', { name: 'Cancel' });
		expect(cancelBtnEnabled.disabled).eq(false);
		await fireEvent.click(cancelBtnEnabled);

		expect(screen.getByRole('textbox').value).eq(
			JSON.stringify({ changed_property: 'x' }, null, 2)
		);
	});

	it('trying to fix the arguments with invalid JSON', async () => {
		const task = getTask('My Task', '1.2.4');
		const versions = await checkVersions(task, 1);
		expect(versions[0]).toBe('2.0.0');

		await fireEvent.change(screen.getByRole('combobox'), { target: { value: '2.0.0' } });

		const checkBtn = screen.getByRole('button', { name: 'Check' });
		const updateBtn = screen.getByRole('button', { name: 'Update' });
		expect(updateBtn.disabled).eq(true);

		await fireEvent.input(screen.getByRole('textbox'), {
			target: { value: '}{' }
		});
		await fireEvent.click(checkBtn);

		expect(screen.getByRole('textbox').classList.contains('is-invalid')).eq(true);
		expect(screen.getByText('Invalid JSON')).toBeDefined();
	});

	it('no new versions available', async () => {
		const task = getTask('My Other Task', '1.3.0');
		await checkVersions(task, 0);
	});

	it('display warning if task has no version', () => {
		renderVersionUpdate(getTask('null version task', null));
		expect(
			screen.getByText(
				'It is not possible to check for new versions because task version is not set.'
			)
		).toBeDefined();
	});

	it('display warning if task has no args_schema', () => {
		renderVersionUpdate(getTask('no args schema task', '1.5.0'));
		expect(
			screen.getByText(
				'It is not possible to check for new versions because task has no args_schema.'
			)
		).toBeDefined();
	});

	it('update task with default parameters and no previous values', async () => {
		const task = getTask('task_default_values', '0.0.1');
		const versions = await checkVersions(task, 1);
		expect(versions[0]).toBe('0.0.2');

		await fireEvent.change(screen.getByRole('combobox'), { target: { value: '0.0.2' } });

		const btn = screen.getByRole('button', { name: 'Update' });
		expect(btn.disabled).eq(false);
		await fireEvent.click(btn);

		expect(fetch).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining('/wftask/replace-task'),
			expect.objectContaining({
				body: JSON.stringify({
					args_non_parallel: {
						default_boolean1: false,
						default_boolean2: true,
						default_string: 'foo',
					},
					args_parallel: null
				})
			})
		);
	});

	it('update task with default parameters and previous values', async () => {
		const task = getTask('task_default_values', '0.0.1');
		const versions = await checkVersions(task, 1, {
			args_non_parallel: {
				default_boolean1: true,
			}, args_parallel: null
		});
		expect(versions[0]).toBe('0.0.2');

		await fireEvent.change(screen.getByRole('combobox'), { target: { value: '0.0.2' } });

		const btn = screen.getByRole('button', { name: 'Update' });
		expect(btn.disabled).eq(false);
		await fireEvent.click(btn);

		expect(fetch).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining('/wftask/replace-task'),
			expect.objectContaining({
				body: JSON.stringify({
					args_non_parallel: {
						default_boolean1: true,
						default_boolean2: true,
						default_string: 'foo',
					},
					args_parallel: null
				})
			})
		);
	});
});

async function checkVersions(
	task,
	expectedCount,
	workflowTask = { args_non_parallel: null, args_parallel: null }
) {
	const result = renderVersionUpdate(task, workflowTask);

	// triggers the updates
	await new Promise(setTimeout);

	if (expectedCount === 0) {
		expect(result.getByText('No new versions available')).toBeDefined();
		return;
	}

	const options = result.getAllByRole('option');
	expect(options.length).toBe(expectedCount + 1);
	expect(options[0].value).toBe('');
	return options.filter((_, i) => i > 0).map((o) => o.value);
}

function renderVersionUpdate(
	task,
	workflowTask = { args_non_parallel: null, args_parallel: null }
) {
	workflowTask.task = task;
	const nop = function () {};
	mockTaskGroupsList();
	return render(VersionUpdate, {
		props: {
			workflowTask,
			updateWorkflowCallback: nop,
			updateNewVersionsCount: nop
		}
	});
}
