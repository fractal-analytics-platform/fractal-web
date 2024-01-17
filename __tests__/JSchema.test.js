import { describe, it, expect } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';

import JSchema from '../src/lib/components/common/jschema/JSchema.svelte';

describe('JSchema', () => {
	it('NumberProperty with title', async () => {
		const result = renderSchemaWithSingleProperty({
			title: 'Number title',
			type: 'integer'
		});
		const spinbutton = result.getByRole('spinbutton', { name: 'Number title' });
		expect(spinbutton).toBeDefined();
	});

	it('NumberProperty without title', async () => {
		const result = renderSchemaWithSingleProperty({ type: 'integer' });
		const spinbutton = result.getByRole('spinbutton', { name: 'Number argument' });
		expect(spinbutton).toBeDefined();
	});

	it('StringProperty with title', async () => {
		const result = renderSchemaWithSingleProperty({
			title: 'String title',
			type: 'string'
		});
		const textbox = result.getByRole('textbox', { name: 'String title' });
		expect(textbox).toBeDefined();
	});

	it('StringProperty without title', async () => {
		const result = renderSchemaWithSingleProperty({ type: 'string' });
		const textbox = result.getByRole('textbox', { name: 'String argument' });
		expect(textbox).toBeDefined();
	});

	it('EnumProperty with title', async () => {
		const result = renderSchemaWithSingleProperty({
			title: 'Enum title',
			enum: ['option1', 'option2'],
			type: 'string'
		});
		const combobox = result.getByRole('combobox', { name: 'Enum title' });
		const options = combobox.querySelectorAll('option');
		expect(options[0].text).eq('Select...');
		expect(options[1].value).eq('option1');
		expect(options[2].value).eq('option2');
	});

	it('EnumProperty without title', async () => {
		const result = renderSchemaWithSingleProperty({
			enum: ['option1', 'option2'],
			type: 'string'
		});
		const combobox = result.getByRole('combobox', { name: 'Enum argument' });
		const options = combobox.querySelectorAll('option');
		expect(options[0].text).eq('Select...');
		expect(options[1].value).eq('option1');
		expect(options[2].value).eq('option2');
	});

	it('BooleanProperty with title', async () => {
		const result = renderSchemaWithSingleProperty({
			title: 'Boolean title',
			type: 'boolean'
		});
		const title = result.getByText('Boolean title');
		expect(title).toBeDefined();
		const checkbox = result.getByRole('checkbox');
		expect(checkbox).toBeDefined();
	});

	it('BooleanProperty without title', async () => {
		const result = renderSchemaWithSingleProperty({ type: 'boolean' });
		const title = result.getByText('Boolean argument');
		expect(title).toBeDefined();
		const checkbox = result.getByRole('checkbox');
		expect(checkbox).toBeDefined();
	});

	it('NumberProperty with min and max constraints', async () => {
		const result = renderSchemaWithSingleProperty({
			type: 'integer',
			minimum: 5,
			maximum: 10
		});
		const spinbutton = result.getByRole('spinbutton', { name: 'Number argument' });
		expect(spinbutton).toBeDefined();
		expect(spinbutton.getAttribute('min')).toBe('5');
		expect(spinbutton.getAttribute('max')).toBe('10');
	});

	it('NumberProperty with exclusive min and max constraints', async () => {
		const result = renderSchemaWithSingleProperty({
			type: 'integer',
			exclusiveMinimum: 5,
			exclusiveMaximum: 10
		});
		const spinbutton = result.getByRole('spinbutton', { name: 'Number argument' });
		expect(spinbutton).toBeDefined();
		expect(spinbutton.getAttribute('min')).toBe('6');
		expect(spinbutton.getAttribute('max')).toBe('9');
	});

	it('ArrayProperty with default values', async () => {
		const result = renderSchemaWithSingleProperty({
			type: 'array',
			items: { type: 'string' },
			default: ['foo', 'bar']
		});
		const inputs = result.getAllByRole('textbox');
		expect(inputs.length).eq(2);
		expect(inputs[0].value).eq('foo');
		expect(inputs[1].value).eq('bar');
	});

	it('ArrayProperty with minItems and maxItems', async () => {
		const result = renderSchemaWithSingleProperty({
			type: 'array',
			items: { type: 'string' },
			minItems: 3,
			maxItems: 5
		});
		let inputs = result.getAllByRole('textbox');
		expect(inputs.length).eq(3);
		const addBtn = result.getByRole('button', { name: 'Add argument to list' });
		await fireEvent.click(addBtn);
		await fireEvent.click(addBtn);
		await fireEvent.click(addBtn);
		inputs = result.getAllByRole('textbox');
		expect(inputs.length).eq(5);
	});
});

/**
 * @param {object} schemaProperty
 */
function renderSchemaWithSingleProperty(schemaProperty) {
	return renderSchema({
		title: 'Args',
		type: 'object',
		properties: {
			testProp: schemaProperty
		},
		required: ['testProp']
	});
}
/**
 * @param {object} schema
 * @param {object} schemaData
 */
function renderSchema(schema, schemaData = {}) {
	return render(JSchema, {
		props: { schema, schemaData }
	});
}
