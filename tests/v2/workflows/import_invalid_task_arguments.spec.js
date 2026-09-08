import { expect, test } from '../workflow_fixture.js';
import { getRandomName, waitModal, waitModalClosed, waitPageLoading } from '../../utils/utils.js';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createFakeTask, deleteTask } from '../../utils/v2/task.js';

test('Import invalid task arguments', async ({ page, workflow }) => {
	await page.goto(workflow.url);
	await waitPageLoading(page);

	test.slow();

	let nonParallelTask;
	let parallelTask;
	let compoundTask;

	let argumentsFile;

	await test.step('Create bad arguments to import file', async () => {
		argumentsFile = path.join(os.tmpdir(), getRandomName());
		fs.writeFileSync(
			argumentsFile,
			JSON.stringify({
				args_parallel: {
					x: { foo: 1234 }
				},
				args_non_parallel: {
					suffix: 'xxx',
					bar: 'y'
				}
			})
		);
	});

	await test.step('Create test tasks', async () => {
		nonParallelTask = await createFakeTask(page, { type: 'non_parallel' });
		parallelTask = await createFakeTask(page, { type: 'parallel' });
		compoundTask = await createFakeTask(page, {
			type: 'compound',
			args_schema_non_parallel: {
				additionalProperties: false,
				properties: {
					zarr_urls: {
						items: {
							type: 'string'
						},
						type: 'array'
					},
					zarr_dir: {
						type: 'string'
					},
					suffix: {
						default: 'new',
						type: 'string'
					}
				},
				required: ['zarr_urls', 'zarr_dir'],
				type: 'object'
			},
			args_schema_parallel: {
				$defs: {
					InitArgsMIP: {
						properties: {
							new_zarr_url: {
								type: 'string'
							},
							new_plate: {
								type: 'string'
							}
						},
						required: ['new_zarr_url', 'new_plate'],
						type: 'object'
					}
				},
				additionalProperties: false,
				properties: {
					zarr_url: {
						type: 'string'
					},
					init_args: {
						$ref: '#/$defs/InitArgsMIP'
					}
				},
				required: ['zarr_url', 'init_args'],
				type: 'object'
			}
		});
	});

	await test.step('Open workflow page', async () => {
		await workflow.openWorkflowPage();
	});

	await test.step('Attempt to import compound arguments to non parallel task', async () => {
		await workflow.addTask(nonParallelTask);
		await workflow.selectTask(nonParallelTask);
		await importArguments(page, argumentsFile);
		await expect(
			page.getByText(
				/Cannot patch `WorkflowTaskV2.args_parallel` or `WorkflowTask.meta_parallel` if the associated Task is non parallel./
			)
		).toBeVisible();
		await workflow.removeCurrentTask();
	});

	await test.step('Attempt to import compound arguments to parallel task', async () => {
		await workflow.addTask(parallelTask);
		await workflow.selectTask(parallelTask);
		await importArguments(page, argumentsFile);
		await expect(
			page.getByText(
				/Cannot patch `WorkflowTaskV2.args_non_parallel` or `WorkflowTask.meta_non_parallel` if the associated Task is parallel./
			)
		).toBeVisible();
		await workflow.removeCurrentTask();
	});

	await test.step('Import invalid arguments to compound task', async () => {
		await workflow.addTask(compoundTask);
		await workflow.selectTask(compoundTask);
		await expect(page.getByText(/Initialisation Arguments/)).not.toBeVisible();
		await expect(page.getByText(/Compute Arguments/)).not.toBeVisible();
		await importArguments(page, argumentsFile);
		await expect(page.getByText(/must NOT have additional properties/)).toHaveCount(2);
		await expect(page.getByText(/Initialisation Arguments/)).toBeVisible();
		await expect(page.getByText(/Compute Arguments/)).toBeVisible();
		await page.getByRole('button', { name: 'Remove Property Block' }).last().click();
		await expect(page.getByText(/must NOT have additional properties/)).toHaveCount(1);
		await page.getByRole('button', { name: 'Remove Property Block' }).click();
		await expect(page.getByText(/must NOT have additional properties/)).toHaveCount(0);
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
		await expect(page.getByText(/Arguments changes saved successfully/)).toBeVisible();
		await expect(page.getByText(/Initialisation Arguments/)).not.toBeVisible();
		await expect(page.getByText(/Compute Arguments/)).not.toBeVisible();
		await workflow.removeCurrentTask();
	});

	await test.step('Cleanup', async () => {
		await deleteTask(page, nonParallelTask);
		await deleteTask(page, parallelTask);
		await deleteTask(page, compoundTask);
		fs.rmSync(argumentsFile);
	});
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} argumentsFile
 */
async function importArguments(page, argumentsFile) {
	await page.getByRole('button', { name: 'Import' }).click();
	const modal = await waitModal(page);
	const fileChooserPromise = page.waitForEvent('filechooser');
	await modal.getByText('Select arguments file').click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(argumentsFile);
	await modal.getByRole('button', { name: 'Confirm' }).click();
	await waitModalClosed(page);
}
