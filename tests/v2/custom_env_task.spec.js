import { expect, test } from '@playwright/test';
import { uploadFile, waitPageLoading } from '../utils.js';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { deleteTask } from './task_utils.js';

test('Custom Python env task [v2]', async ({ page }) => {
	await page.goto('/v2/tasks/management');
	await waitPageLoading(page);

	await page.getByText('Custom Python env').click();

	const randomName = Math.random().toString(36).substring(7);

	const manifestData = {
		args_schema_version: 'pydantic_v2',
		has_args_schemas: true,
		manifest_version: '2',
		task_list: [
			{
				name: randomName,
				args_schema_parallel: {},
				executable_parallel: 'sh'
			}
		]
	};

	const packageFolder = path.join(os.tmpdir(), randomName);
	fs.mkdirSync(packageFolder);

	let tmpManifest;

	await test.step('Test "Python interpreter path must be absolute" error', async () => {
		await page.getByRole('textbox', { name: 'Python Intepreter' }).fill('foo');
		await page.getByRole('textbox', { name: 'Label' }).fill(`${randomName}-label`);
		tmpManifest = await uploadFile(
			page,
			'Manifest',
			'__FRACTAL_MANIFEST__.json',
			manifestData,
			packageFolder
		);
		await page.getByRole('textbox', { name: 'Version' }).fill('0.0.1');
		await page.getByRole('textbox', { name: 'Package Folder' }).fill(packageFolder);

		await page.getByRole('button', { name: 'Collect' }).click();

		await expect(page.getByText('Python interpreter path must be absolute')).toBeVisible();
	});

	await test.step("Test \"One and only one must be set between 'package_root' and 'package_name'\" error", async () => {
		await page.getByRole('textbox', { name: 'Python Intepreter' }).fill('/usr/bin/python3');
		await page.getByRole('textbox', { name: 'Package Name' }).fill(randomName);

		await page.getByRole('button', { name: 'Collect' }).click();

		await expect(page.getByText('Python interpreter path must be absolute')).not.toBeVisible();
		await expect(
			page.getByText("One and only one must be set between 'package_root' and 'package_name'")
		).toBeVisible();
	});

	await test.step('Remove package name and collect the tasks', async () => {
		await page.getByRole('textbox', { name: 'Package Name' }).clear();
		await page.getByRole('button', { name: 'Collect' }).click();
		await expect(page.getByText('Tasks collected successfully')).toBeVisible();
		await expect(
			page.getByText("One and only one must be set between 'package_root' and 'package_name'")
		).not.toBeVisible();
	});

	await test.step('Verify that fields have been cleaned', async () => {
		await expect(page.getByRole('textbox', { name: 'Python Intepreter' })).toHaveValue('');
		await expect(page.getByRole('textbox', { name: 'Label' })).toHaveValue('');
		await expect(page.getByLabel('Manifest')).toHaveValue('');
		await expect(page.getByRole('textbox', { name: 'Package Name' })).toHaveValue('');
		await expect(page.getByRole('textbox', { name: 'Version' })).toHaveValue('');
		await expect(page.getByRole('textbox', { name: 'Package Folder' })).toHaveValue('');
	});

	await test.step('Check task in the table and delete it', async () => {
		const taskRow = page.getByRole('row', { name: randomName });
		await expect(taskRow).toBeVisible();
	});

	await test.step('Delete task', async () => {
		await deleteTask(page, randomName);
	});

	await test.step('Remove temporary file and folder', async () => {
		fs.rmSync(tmpManifest);
		fs.rmdirSync(packageFolder);
	});
});
