import { waitModal, waitModalClosed, waitPageLoading } from '../../utils/utils.js';
import { expect, test } from '../project_fixture.js';

test('Star/Unstar workflow', async ({ page, project }) => {
	await page.goto(project.url);
	await waitPageLoading(page);

	// crate three workflows: A, B and C
	await createWorkflow(page, project.url, 'C');
	await createWorkflow(page, project.url, 'A');
	await createWorkflow(page, project.url, 'B');

	let workflowTable = page.getByRole('table').nth(0);

	let workflow1 = workflowTable.getByRole('row').nth(1).getByRole('cell').nth(0);
	let workflow2 = workflowTable.getByRole('row').nth(2).getByRole('cell').nth(0);
	let workflow3 = workflowTable.getByRole('row').nth(3).getByRole('cell').nth(0);

	// alphabetic order
	await expect(workflow1).toHaveText('A');
	await expect(workflow2).toHaveText('B');
	await expect(workflow3).toHaveText('C');

	let starIcon1 = workflow1.getByRole('button', { name: 'star workflow' }).locator('i');
	let starIcon2 = workflow2.getByRole('button', { name: 'star workflow' }).locator('i');
	let starIcon3 = workflow3.getByRole('button', { name: 'star workflow' }).locator('i');

	// all unstarred
	await expect(starIcon1).toHaveClass(/bi-star(?!-fill)/);
	await expect(starIcon2).toHaveClass(/bi-star(?!-fill)/);
	await expect(starIcon3).toHaveClass(/bi-star(?!-fill)/);

	// star workflow B
	await workflow2.getByRole('button', { name: 'star workflow' }).click();

	await expect(starIcon1).toHaveClass(/bi-star(?!-fill)/);
	await expect(starIcon2).toHaveClass(/bi-star-fill/);
	await expect(starIcon3).toHaveClass(/bi-star(?!-fill)/);

	// reload
	await page.reload();

	// starred first
	await expect(workflow1).toHaveText('B');
	await expect(workflow2).toHaveText('A');
	await expect(workflow3).toHaveText('C');
	await expect(starIcon1).toHaveClass(/bi-star-fill/);
	await expect(starIcon2).toHaveClass(/bi-star(?!-fill)/);
	await expect(starIcon3).toHaveClass(/bi-star(?!-fill)/);

	// unstar workflow B
	await workflow1.getByRole('button', { name: 'star workflow' }).click();
	// star workflow C
	await workflow3.getByRole('button', { name: 'star workflow' }).click();

	await expect(starIcon1).toHaveClass(/bi-star(?!-fill)/);
	await expect(starIcon2).toHaveClass(/bi-star(?!-fill)/);
	await expect(starIcon3).toHaveClass(/bi-star-fill/);

	// reload
	await page.reload();

	await expect(workflow1).toHaveText('C');
	await expect(workflow2).toHaveText('A');
	await expect(workflow3).toHaveText('B');
	await expect(starIcon1).toHaveClass(/bi-star-fill/);
	await expect(starIcon2).toHaveClass(/bi-star(?!-fill)/);
	await expect(starIcon3).toHaveClass(/bi-star(?!-fill)/);
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} workflowName
 */
async function createWorkflow(page, projectUrl, workflowName) {
	await page.getByRole('button', { name: 'Create new workflow' }).click();
	const modal = await waitModal(page);
	await modal.getByRole('textbox', { name: 'Workflow name' }).fill(workflowName);
	await modal.getByRole('button', { name: 'Create empty workflow' }).click();
	await waitModalClosed(page);
	await page.waitForURL(/\/v2\/projects\/\d+\/workflows\/\d+/);
	await waitPageLoading(page);
	await page.goto(projectUrl);
}
