import { uploadFile, waitPageLoading } from '../utils.js';
import { expect, test } from './workflow_fixture.js';

test('Task version update [v1]', async ({ page, workflow }) => {
	await page.waitForURL(workflow.url);
	await waitPageLoading(page);

	await test.step('Go to "Add a single task" form', async () => {
		await page.goto('/v1/tasks');
		await waitPageLoading(page);
		await page.getByText('Single task').click();
	});

	const randomTaskName = Math.random().toString(36).substring(7);

	const schemas = {
		'0.0.1': {
			properties: {
				p1: { type: 'string' }
			},
			type: 'object'
		},
		'0.0.2': {
			properties: {
				p1: { type: 'string' }
			},
			type: 'object',
			required: ['p1']
		}
	};

	await test.step('Create test tasks', async () => {
		for (const version of ['0.0.1', '0.0.2']) {
			await page.getByRole('textbox', { name: 'Task name' }).fill(randomTaskName);
			await page.getByRole('textbox', { name: 'Command' }).fill('/tmp/test');
			await page
				.getByRole('textbox', { name: 'Source' })
				.fill(`${randomTaskName}-source-${version}`);
			await page.getByRole('textbox', { name: 'Input Type' }).fill('Any');
			await page.getByRole('textbox', { name: 'Output Type' }).fill('Any');
			await page.getByRole('textbox', { name: 'Version' }).fill(version);
			await uploadFile(
				page,
				'Upload args schema',
				`args-schema-${randomTaskName}-${version}.json`,
				schemas[version]
			);
			const createBtn = page.getByRole('button', { name: /^Create$/ });
			await createBtn.click();
			await page.getByText('Task created successfully').waitFor();
		}
	});

	await test.step('Add task to workflow', async () => {
		await workflow.openWorkflowPage();
		await workflow.addUserTask(randomTaskName, 'v0.0.1');
		await page.getByText(`${randomTaskName} #`).first().click();
	});

	await test.step('Update task to v2', async () => {
		await page.getByRole('button', { name: 'Version' }).click();
		await page
			.getByRole('combobox', { name: 'New versions of this task exist:' })
			.selectOption('0.0.2');
		await page.getByText('Following errors must be fixed before performing the update').waitFor();
		await expect(page.locator('.alert-danger li')).toHaveCount(1);
		await page.getByRole('textbox', { name: 'Fix the arguments:' }).fill('{"p1": "test"}');
		await page.getByRole('button', { name: 'Check' }).click();
		await page.getByText('The arguments are valid').waitFor();
		await page.getByRole('button', { name: 'Update' }).click();
		await page.getByText('No new versions available').waitFor();
	});
});
