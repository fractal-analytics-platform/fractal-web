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
import VersionUpdate from '../../src/lib/components/v1/workflow/VersionUpdate.svelte';

const task3ArgsSchema = {
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
		const versions = await checkVersions(task, 1, { extra_property: 1, changed_property: 'x' });
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
		const versions = await checkVersions(task, 1, { changed_property: 'x' });
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

async function checkVersions(task, expectedCount, args = {}) {
	const result = renderVersionUpdate(task, args);

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

function renderVersionUpdate(task, args) {
	const nop = function () {};
	mockTaskList();

	const workflowTask = { task, args };

	return render(VersionUpdate, {
		props: { workflowTask, updateWorkflowCallback: nop, updateNewVersionsCount: nop }
	});
}
