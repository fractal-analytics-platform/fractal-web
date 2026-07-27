import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import ImageAttributesTypesForm from '../../src/lib/components/v2/projects/datasets/ImageAttributesTypesForm.svelte';
import { tick } from 'svelte';

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

describe('AttributesTypesForm', () => {
	it('init with existing values', async () => {
		const result = render(ImageAttributesTypesForm);
		result.component.init(
			{
				key1: 'value1',
				key2: 42
			},
			{
				key3: true
			}
		);
		await tick();
		const keys = result
			.queryAllByPlaceholderText('Key')
			.map((e) => /** @type {HTMLInputElement} */ (e).value);
		expect(keys.length).eq(3);
		expect(keys[0]).eq('key1');
		expect(keys[1]).eq('key2');
		expect(keys[2]).eq('key3');
		const values = result
			.queryAllByPlaceholderText('Value')
			.map((e) => /** @type {HTMLInputElement} */ (e).value);
		expect(values.length).eq(2);
		expect(values[0]).eq('value1');
		expect(values[1]).eq('42');
	});

	it('add and remove attribute', async () => {
		const user = userEvent.setup();
		const result = render(ImageAttributesTypesForm);
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
		await user.click(result.getByRole('button', { name: 'Add attribute' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(1);
		await user.click(result.getByRole('button', { name: 'Remove attribute' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
	});

	it('add and remove type', async () => {
		const user = userEvent.setup();
		const result = render(ImageAttributesTypesForm);
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
		await user.click(result.getByRole('button', { name: 'Add type' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(1);
		await user.click(result.getByRole('button', { name: 'Remove type' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
	});

	it('validate missing attribute key', async () => {
		const user = userEvent.setup();
		const result = render(ImageAttributesTypesForm);
		result.component.init({}, {});
		await user.click(result.getByRole('button', { name: 'Add attribute' }));
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Key is required')).toBeDefined();
	});

	it('validate missing attribute value', async () => {
		const user = userEvent.setup();
		const result = render(ImageAttributesTypesForm);
		result.component.init({}, {});
		await user.click(result.getByRole('button', { name: 'Add attribute' }));
		await user.type(result.getByPlaceholderText('Key'), 'my-key');
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Value is required')).toBeDefined();
	});

	it('validate invalid number', async () => {
		const user = userEvent.setup();
		const result = render(ImageAttributesTypesForm);
		await user.click(result.getByRole('button', { name: 'Add attribute' }));
		await user.type(result.getByPlaceholderText('Key'), 'my-key');
		await user.selectOptions(result.getByLabelText('Type'), 'number');
		await user.type(result.getByPlaceholderText('Value'), 'foo');
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Invalid number')).toBeDefined();
	});

	it('switch to number attribute from string containing a numeric value (number is preserved)', async () => {
		const user = userEvent.setup();
		const result = render(ImageAttributesTypesForm);
		await user.click(result.getByRole('button', { name: 'Add attribute' }));
		await user.type(result.getByPlaceholderText('Key'), 'my-key');
		await user.type(result.getByPlaceholderText('Value'), '42');
		await user.selectOptions(result.getByLabelText('Type'), 'number');
		expect(result.getByPlaceholderText('Value')).toHaveValue('42');
		expect(result.component.validateFields()).true;
	});

	it('switch to number attribute from string containing text (number is reset)', async () => {
		const user = userEvent.setup();
		const result = render(ImageAttributesTypesForm);
		await user.click(result.getByRole('button', { name: 'Add attribute' }));
		await user.type(result.getByPlaceholderText('Key'), 'my-key');
		await user.type(result.getByPlaceholderText('Value'), 'foo');
		await user.selectOptions(result.getByLabelText('Type'), 'number');
		expect(result.getByPlaceholderText('Value')).toHaveValue('');
		expect(result.component.validateFields()).false;
	});

	it('switch to boolean attribute, default to false', async () => {
		const user = userEvent.setup();
		const result = render(ImageAttributesTypesForm);
		await user.click(result.getByRole('button', { name: 'Add attribute' }));
		await user.type(result.getByPlaceholderText('Key'), 'my-key');
		await user.selectOptions(result.getByLabelText('Type'), 'boolean');
		expect(result.getByLabelText('Value')).toHaveValue('false');
		expect(result.component.validateFields()).true;
	});

	it('switch to boolean attribute from string equals to "true", true is set', async () => {
		const user = userEvent.setup();
		const result = render(ImageAttributesTypesForm);
		await user.click(result.getByRole('button', { name: 'Add attribute' }));
		await user.type(result.getByPlaceholderText('Key'), 'my-key');
		await user.type(result.getByPlaceholderText('Value'), 'true');
		await user.selectOptions(result.getByLabelText('Type'), 'boolean');
		expect(result.getByLabelText('Value')).toHaveValue('true');
		expect(result.component.validateFields()).true;
	});

	it('validate duplicated attribute key', async () => {
		const user = userEvent.setup();
		const result = render(ImageAttributesTypesForm);
		await user.click(result.getByRole('button', { name: 'Add attribute' }));
		await user.type(result.getByPlaceholderText('Key'), 'my-key');
		await user.type(result.getByPlaceholderText('Value'), 'foo');
		await user.click(result.getByRole('button', { name: 'Add attribute' }));
		await user.type(result.queryAllByPlaceholderText('Key')[1], 'my-key');
		await user.type(result.queryAllByPlaceholderText('Value')[1], 'bar');
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Duplicated key')).toBeDefined();
	});

	it('allow same key for attribute and type', async () => {
		const user = userEvent.setup();
		const result = render(ImageAttributesTypesForm);
		await user.click(result.getByRole('button', { name: 'Add attribute' }));
		await user.type(result.getByPlaceholderText('Key'), 'my-key');
		await user.type(result.getByPlaceholderText('Value'), 'foo');
		await user.click(result.getByRole('button', { name: 'Add type' }));
		await user.type(result.queryAllByPlaceholderText('Key')[1], 'my-key');
		expect(result.component.validateFields()).true;
	});

	it('validate missing type key', async () => {
		const user = userEvent.setup();
		const result = render(ImageAttributesTypesForm);
		result.component.init({}, {});
		await user.click(result.getByRole('button', { name: 'Add type' }));
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Key is required')).toBeDefined();
	});

	it('validate duplicated type key', async () => {
		const user = userEvent.setup();
		const result = render(ImageAttributesTypesForm);
		result.component.init({}, {});
		await user.click(result.getByRole('button', { name: 'Add type' }));
		await user.type(result.getByPlaceholderText('Key'), 'my-key');
		await user.click(result.getByRole('button', { name: 'Add type' }));
		await user.type(result.queryAllByPlaceholderText('Key')[1], 'my-key');
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Duplicated key')).toBeDefined();
	});
});
