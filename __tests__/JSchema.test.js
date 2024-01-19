import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import JSchema from '../src/lib/components/common/jschema/JSchema.svelte';

describe('JSchema', () => {
	it('Required NumberProperty with title', async () => {
		const result = renderSchemaWithSingleProperty(
			{
				title: 'Number title',
				type: 'integer'
			},
			true
		);
		checkBold(result.getByText('Number title'), true);
		const spinbutton = result.getByRole('spinbutton', { name: 'Number title' });
		expect(spinbutton).toBeDefined();
	});

	it('Optional NumberProperty without title', async () => {
		const result = renderSchemaWithSingleProperty({ type: 'integer' });
		checkBold(result.getByText('Number argument'), false);
		const spinbutton = result.getByRole('spinbutton', { name: 'Number argument' });
		expect(spinbutton).toBeDefined();
	});

	it('NumberProperty referenced', async () => {
		const result = renderSchemaWithReferencedProperty({ type: 'number' });
		checkBold(result.getByText('Number argument'), false);
		const spinbutton = result.getByRole('spinbutton', { name: 'Number argument' });
		expect(spinbutton).toBeDefined();
	});

	it('Required StringProperty with title', async () => {
		const result = renderSchemaWithSingleProperty(
			{
				title: 'String title',
				type: 'string'
			},
			true
		);
		checkBold(result.getByText('String title'), true);
		const textbox = result.getByRole('textbox', { name: 'String title' });
		expect(textbox).toBeDefined();
	});

	it('Optional StringProperty without title', async () => {
		const result = renderSchemaWithSingleProperty({ type: 'string' });
		checkBold(result.getByText('String argument'), false);
		const textbox = result.getByRole('textbox', { name: 'String argument' });
		expect(textbox).toBeDefined();
	});

	it('StringProperty referenced', async () => {
		const result = renderSchemaWithReferencedProperty({ type: 'string' });
		checkBold(result.getByText('String argument'), false);
		const textbox = result.getByRole('textbox', { name: 'String argument' });
		expect(textbox).toBeDefined();
	});

	it('Required EnumProperty with title', async () => {
		const result = renderSchemaWithSingleProperty(
			{
				title: 'Enum title',
				enum: ['option1', 'option2'],
				type: 'string'
			},
			true
		);
		checkBold(result.getByText('Enum title'), true);
		const combobox = result.getByRole('combobox', { name: 'Enum title' });
		const options = combobox.querySelectorAll('option');
		expect(options[0].text).eq('Select...');
		expect(options[1].value).eq('option1');
		expect(options[2].value).eq('option2');
	});

	it('Optional EnumProperty without title', async () => {
		const result = renderSchemaWithSingleProperty({
			enum: ['option1', 'option2'],
			type: 'string'
		});
		checkBold(result.getByText('Enum argument'), false);
		const combobox = result.getByRole('combobox', { name: 'Enum argument' });
		const options = combobox.querySelectorAll('option');
		expect(options[0].text).eq('Select...');
		expect(options[1].value).eq('option1');
		expect(options[2].value).eq('option2');
	});

	it('EnumProperty referenced', async () => {
		const result = renderSchemaWithReferencedProperty({
			enum: ['option1', 'option2'],
			type: 'string'
		});
		checkBold(result.getByText('Enum argument'), false);
		const combobox = result.getByRole('combobox', { name: 'Enum argument' });
		const options = combobox.querySelectorAll('option');
		expect(options[0].text).eq('Select...');
		expect(options[1].value).eq('option1');
		expect(options[2].value).eq('option2');
	});

	it('Required BooleanProperty with title', async () => {
		const result = renderSchemaWithSingleProperty(
			{
				title: 'Boolean title',
				type: 'boolean'
			},
			true
		);
		const title = result.getByText('Boolean title');
		checkBold(title, true);
		expect(title).toBeDefined();
		const checkbox = result.getByRole('checkbox');
		expect(checkbox).toBeDefined();
	});

	it('BooleanProperty without title', async () => {
		const result = renderSchemaWithSingleProperty({ type: 'boolean' }, false);
		const title = result.getByText('Boolean argument');
		checkBold(title, false);
		expect(title).toBeDefined();
		const checkbox = result.getByRole('checkbox');
		expect(checkbox).toBeDefined();
	});

	it('BooleanProperty referenced', async () => {
		const result = renderSchemaWithReferencedProperty({ type: 'boolean' });
		const title = result.getByText('Boolean argument');
		checkBold(title, false);
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

	it('Optional ArrayProperty with default values', async () => {
		const result = renderSchemaWithSingleProperty(
			{
				title: 'ArrayProperty',
				type: 'array',
				items: { type: 'string' },
				default: ['foo', 'bar']
			},
			false
		);
		checkBold(result.getByText('ArrayProperty'), false);
		const inputs = result.getAllByRole('textbox');
		expect(inputs.length).eq(2);
		expect(inputs[0].value).eq('foo');
		expect(inputs[1].value).eq('bar');
	});

	it('Required ArrayProperty with minItems and maxItems', async () => {
		const result = renderSchemaWithSingleProperty(
			{
				title: 'ArrayProperty',
				type: 'array',
				items: { type: 'string' },
				minItems: 3,
				maxItems: 5
			},
			true
		);
		checkBold(result.getByText('ArrayProperty'), true);
		let inputs = result.getAllByRole('textbox');
		expect(inputs.length).eq(3);
		const addBtn = result.getByRole('button', { name: 'Add argument to list' });
		await fireEvent.click(addBtn);
		await fireEvent.click(addBtn);
		await fireEvent.click(addBtn);
		inputs = result.getAllByRole('textbox');
		expect(inputs.length).eq(5);
	});

	it('Optional ArrayProperty with minItems and maxItems', async () => {
		const result = renderSchemaWithSingleProperty(
			{
				title: 'ArrayProperty',
				type: 'array',
				items: { type: 'string' },
				minItems: 2,
				maxItems: 3
			},
			false
		);
		checkBold(result.getByText('ArrayProperty'), false);
		let inputs = result.queryAllByRole('textbox');
		expect(inputs.length).eq(0);
		const addBtn = result.getByRole('button', { name: 'Add argument to list' });
		await fireEvent.click(addBtn);
		await fireEvent.click(addBtn);
		await fireEvent.click(addBtn);
		await fireEvent.click(addBtn);
		inputs = result.queryAllByRole('textbox');
		expect(inputs.length).eq(3);
	});

	it('Required nested objects', async () => {
		const result = renderSchema({
			title: 'Args',
			type: 'object',
			properties: {
				requiredReferencedProperty: {
					$ref: '#/definitions/Ref1'
				},
				optionalArray: {
					title: 'array1 (optional)',
					type: 'array',
					items: {
						title: 'array1 item title',
						type: 'object',
						properties: {
							array1RequiredInteger: {
								title: 'array1RequiredInteger',
								type: 'integer'
							},
							array1OptionalInteger: {
								title: 'array1OptionalInteger',
								type: 'integer'
							}
						},
						required: ['array1RequiredInteger']
					}
				}
			},
			required: ['requiredReferencedProperty'],
			definitions: {
				Ref1: {
					title: 'Ref1',
					type: 'object',
					properties: {
						ref1RequiredArray: {
							title: 'ref1RequiredArray',
							type: 'array',
							items: {
								$ref: '#/definitions/Ref2'
							}
						},
						ref1RequiredString: {
							title: 'ref1RequiredString',
							type: 'string'
						},
						ref1OptionalString: {
							title: 'ref1OptionalString',
							type: 'string'
						}
					},
					required: ['ref1RequiredArray', 'ref1RequiredString']
				},
				Ref2: {
					title: 'Ref2',
					type: 'object',
					properties: {
						ref2RequiredString: {
							title: 'ref2RequiredString',
							type: 'string'
						},
						ref2OptionalString: {
							title: 'ref2OptionalString',
							type: 'string'
						}
					},
					required: ['ref2RequiredString']
				}
			}
		});

		// Insert element into first array
		let addBtn = result.getAllByRole('button', { name: 'Add argument to list' })[0];
		await fireEvent.click(addBtn);

		// Insert element into ref1 array
		addBtn = result.getAllByRole('button', { name: 'Add argument to list' })[1];
		await fireEvent.click(addBtn);

		checkBold(result.getByText('Ref1'), true);
		checkBold(result.getByText('array1 (optional)'), false);
		checkBold(result.getByText('array1RequiredInteger'), true);
		checkBold(result.getByText('array1OptionalInteger'), false);
		checkBold(result.getByText('ref1RequiredArray'), true);
		checkBold(result.getByText('ref1RequiredString'), true);
		checkBold(result.getByText('ref1OptionalString'), false);
		checkBold(result.getByText('ref2RequiredString'), true);
		checkBold(result.getByText('ref2OptionalString'), false);
	});
});

/**
 * @param {object} schemaProperty
 * @param {boolean} required
 */
function renderSchemaWithSingleProperty(schemaProperty, required = false) {
	const schema = {
		title: 'Args',
		type: 'object',
		properties: {
			testProp: schemaProperty
		}
	};
	if (required) {
		schema.required = ['testProp'];
	}
	return renderSchema(schema);
}

/**
 * @param {object} schemaProperty
 */
function renderSchemaWithReferencedProperty(schemaProperty) {
	return renderSchema({
		title: 'Args',
		type: 'object',
		properties: {
			testProp: {
				$ref: '#/definitions/Ref'
			}
		},
		definitions: {
			Ref: schemaProperty
		}
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

/**
 * @param {HTMLElement} element
 * @param {boolean} expected
 */
function checkBold(element, expected) {
	const isBold = element.classList.contains('fw-bold');
	if (isBold !== expected) {
		screen.debug(element);
	}
	expect(isBold).eq(expected);
}
