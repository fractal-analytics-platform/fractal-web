import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';

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
