import { describe, it, expect, vi } from 'vitest';
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
import VersionUpdate from '../src/lib/components/workflow/VersionUpdate.svelte';

const task3ArgsSchema = {
	title: 'MyTask',
	type: 'object',
	properties: {
		new_property: {
			type: 'string'
		}
	},
	required: ['new_property']
};

const tasks = [
	{ id: 1, name: 'My Task', owner: null, version: '1.2.3', args_schema: {} },
	{ id: 2, name: 'My Task', owner: null, version: '1.2.4', args_schema: {} },
	{ id: 3, name: 'My Task', owner: null, version: '2.0.0', args_schema: task3ArgsSchema },
	{ id: 4, name: 'My Other Task', owner: null, version: '1.2.3', args_schema: {} },
	{ id: 5, name: 'My Other Task', owner: 'admin', version: '1.3.0', args_schema: {} }
];

function mockTaskList() {
	fetch.mockResolvedValue(createFetchResponse(tasks));
}

function getTask(name, version) {
	return tasks.filter((t) => t.name === name && t.version === version)[0];
}

describe('VersionUpdate', () => {
	it('update task without changing the arguments', async () => {
		const task = getTask('My Task', '1.2.3');
		const versions = await checkVersions(task, 2);
		expect(versions[0]).toBe('2.0.0');
		expect(versions[1]).toBe('1.2.4');

		await fireEvent.change(screen.getByRole('combobox'), { target: { value: '1.2.4' } });

		const btn = screen.getByRole('button');
		expect(btn.textContent).eq('Update');
		expect(btn.disabled).eq(false);
		await fireEvent.click(btn);
	});

	it('update task fixing the arguments', async () => {
		const task = getTask('My Task', '1.2.4');
		const versions = await checkVersions(task, 1);
		expect(versions[0]).toBe('2.0.0');

		await fireEvent.change(screen.getByRole('combobox'), { target: { value: '2.0.0' } });

		const [checkBtn, updateBtnDisabled] = screen.getAllByRole('button');
		expect(checkBtn.textContent).eq('Check');
		expect(updateBtnDisabled.textContent).eq('Update');
		expect(updateBtnDisabled.disabled).eq(true);

		expect(
			screen.getByText('Following errors must be fixed before performing the update:')
		).toBeDefined();

		await fireEvent.input(screen.getByRole('textbox'), {
			target: { value: '{"new_property": "test"}' }
		});
		await fireEvent.click(checkBtn);

		const updateBtnEnabled = screen.getAllByRole('button')[1];
		expect(updateBtnEnabled.textContent).eq('Update');
		expect(updateBtnEnabled.disabled).eq(false);
	});

	it('no new versions available for null owner', async () => {
		const task = getTask('My Other Task', '1.2.3');
		await checkVersions(task, 0);
	});

	it('no new versions available for admin owner', async () => {
		const task = getTask('My Other Task', '1.3.0');
		await checkVersions(task, 0);
	});

	it('display warning if task has no version', () => {
		renderVersionUpdate({ id: 1, name: 'task', owner: null, version: null, args_schema: {} });
		expect(
			screen.getByText(
				'It is not possible to check for new versions because task version is not set.'
			)
		).toBeDefined();
	});

	it('display warning if task has no args_schema', () => {
		renderVersionUpdate({ id: 1, name: 'task', owner: null, version: '1.2.3', args_schema: null });
		expect(
			screen.getByText(
				'It is not possible to check for new versions because task has no args_schema.'
			)
		).toBeDefined();
	});
});

async function checkVersions(task, expectedCount) {
	const result = renderVersionUpdate(task);

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

function renderVersionUpdate(task) {
	const nop = function () {};
	mockTaskList();

	const workflowTask = { task };

	return render(VersionUpdate, {
		props: { workflowTask, updateWorkflowCallback: nop, updateNewVersionsCount: nop }
	});
}
