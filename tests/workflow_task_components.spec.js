import { expect, test } from '@playwright/test';

test('expect number task argument to have default value', async ({ page }) => {
	await page.goto('/tasks/example');

	const numberInput = page.locator('input[type=number]');
	await expect(numberInput).toHaveValue(/0/);
});

test('expect number task argument to update correctly', async ({ page }) => {

	page.on('console', msg => {
		if (msg.type() === 'debug') {
			expect(msg.text()).toBe('2');
		}
	});

	await page.goto('/tasks/example');

	const numberInput = page.locator('input[type=number]');
	await numberInput.fill('2');

	const updateButton = page.locator('#x button');
	await updateButton.click();

});

test('expect string task argument to have default value', async ({ page }) => {
	await page.goto('/tasks/example');

	const numberInput = page.locator('input[type=text]');
	await expect(numberInput).toHaveValue(/default value/);
});

test('expect string task argument to update correctly', async ({ page }) => {

	page.on('console', msg => {
		if (msg.type() === 'debug') {
			expect(msg.text()).toBe('string value');
		}
	});

	await page.goto('/tasks/example');

	const textInput = page.locator('input[type=text]');
	await textInput.fill('string value');

	const updateButton = page.locator('#y button');
	await updateButton.click();

});

test('expect boolean task argument to have default value', async ({ page }) => {
	await page.goto('/tasks/example');

	const argumentInput = page.locator('input[type=checkbox]');
	await expect(argumentInput).toBeChecked();
});

test('expect boolean task argument to update correctly', async ({ page }) => {

	page.on('console', msg => {
		if (msg.type() === 'debug') {
			expect(msg.text()).toBe('false');
		}
	});

	await page.goto('/tasks/example');

	const checkBoxInput = page.locator('input[type=checkbox]');
	await checkBoxInput.check();

	const updateButton = page.locator('#z button');
	await updateButton.click();

});
