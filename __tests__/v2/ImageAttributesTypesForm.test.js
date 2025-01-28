import { describe, it, expect } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';

import ImageAttributesTypesForm from '../../src/lib/components/v2/projects/datasets/ImageAttributesTypesForm.svelte';
import { tick } from 'svelte';

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
		const keys = result.queryAllByPlaceholderText('Key').map((e) => e.value);
		expect(keys.length).eq(3);
		expect(keys[0]).eq('key1');
		expect(keys[1]).eq('key2');
		expect(keys[2]).eq('key3');
		const values = result.queryAllByPlaceholderText('Value').map((e) => e.value);
		expect(values.length).eq(2);
		expect(values[0]).eq('value1');
		expect(values[1]).eq('42');
	});

	it('add and remove attribute', async () => {
		const result = render(ImageAttributesTypesForm);
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(1);
		await fireEvent.click(result.getByRole('button', { name: 'Remove attribute' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
	});

	it('add and remove type', async () => {
		const result = render(ImageAttributesTypesForm);
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
		await fireEvent.click(result.getByRole('button', { name: 'Add type' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(1);
		await fireEvent.click(result.getByRole('button', { name: 'Remove type' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
	});

	it('validate missing attribute key', async () => {
		const result = render(ImageAttributesTypesForm);
		result.component.init({}, {});
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute' }));
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Key is required')).toBeDefined();
	});

	it('validate missing attribute value', async () => {
		const result = render(ImageAttributesTypesForm);
		result.component.init({}, {});
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Value is required')).toBeDefined();
	});

	it('validate invalid number', async () => {
		const result = render(ImageAttributesTypesForm);
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.change(result.getByLabelText('Type'), { target: { value: 'number' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: 'foo' } });
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Invalid number')).toBeDefined();
	});

	it('switch to number attribute from string containing a numeric value (number is preserved)', async () => {
		const result = render(ImageAttributesTypesForm);
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: '42' } });
		await fireEvent.change(result.getByLabelText('Type'), { target: { value: 'number' } });
		expect(result.getByPlaceholderText('Value').value).eq('42');
		expect(result.component.validateFields()).true;
	});

	it('switch to number attribute from string containing text (number is reset)', async () => {
		const result = render(ImageAttributesTypesForm);
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: 'foo' } });
		await fireEvent.change(result.getByLabelText('Type'), { target: { value: 'number' } });
		expect(result.getByPlaceholderText('Value').value).eq('');
		expect(result.component.validateFields()).false;
	});

	it('switch to boolean attribute, default to false', async () => {
		const result = render(ImageAttributesTypesForm);
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.change(result.getByLabelText('Type'), { target: { value: 'boolean' } });
		expect(result.getByLabelText('Value').value).eq('false');
		expect(result.component.validateFields()).true;
	});

	it('switch to boolean attribute from string equals to "true", true is set', async () => {
		const result = render(ImageAttributesTypesForm);
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: 'true' } });
		await fireEvent.change(result.getByLabelText('Type'), { target: { value: 'boolean' } });
		expect(result.getByLabelText('Value').value).eq('true');
		expect(result.component.validateFields()).true;
	});

	it('validate duplicated attribute key', async () => {
		const result = render(ImageAttributesTypesForm);
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: 'foo' } });
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute' }));
		await fireEvent.input(result.queryAllByPlaceholderText('Key')[1], {
			target: { value: 'my-key' }
		});
		await fireEvent.input(result.queryAllByPlaceholderText('Value')[1], {
			target: { value: 'bar' }
		});
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Duplicated key')).toBeDefined();
	});

	it('allow same key for attribute and type', async () => {
		const result = render(ImageAttributesTypesForm);
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: 'foo' } });
		await fireEvent.click(result.getByRole('button', { name: 'Add type' }));
		await fireEvent.input(result.queryAllByPlaceholderText('Key')[1], {
			target: { value: 'my-key' }
		});
		expect(result.component.validateFields()).true;
	});

	it('validate missing type key', async () => {
		const result = render(ImageAttributesTypesForm);
		result.component.init({}, {});
		await fireEvent.click(result.getByRole('button', { name: 'Add type' }));
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Key is required')).toBeDefined();
	});

	it('validate duplicated type key', async () => {
		const result = render(ImageAttributesTypesForm);
		result.component.init({}, {});
		await fireEvent.click(result.getByRole('button', { name: 'Add type' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.click(result.getByRole('button', { name: 'Add type' }));
		await fireEvent.input(result.queryAllByPlaceholderText('Key')[1], {
			target: { value: 'my-key' }
		});
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Duplicated key')).toBeDefined();
	});
});
