import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { readable } from 'svelte/store';

import JSchema from '../../src/lib/components/v2/workflow/JSchema.svelte';

// Mocking the page store
vi.mock('$app/stores', () => {
	return {
		page: readable({
			url: { pathname: '/v1/projects/1/workflows/1' }
		})
	};
});

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
		expect(result.component.getArguments()).deep.eq({ testProp: null });
	});

	it('Optional NumberProperty without title', async () => {
		const result = renderSchemaWithSingleProperty({ type: 'integer' });
		checkBold(result.getByText('Number argument'), false);
		const spinbutton = result.getByRole('spinbutton', { name: 'Number argument' });
		expect(spinbutton).toBeDefined();
		expect(result.component.getArguments()).deep.eq({ testProp: null });
	});

	it('NumberProperty referenced', async () => {
		const result = renderSchemaWithReferencedProperty({ type: 'number' });
		checkBold(result.getByText('Number argument'), false);
		const spinbutton = result.getByRole('spinbutton', { name: 'Number argument' });
		expect(spinbutton).toBeDefined();
		expect(result.component.getArguments()).deep.eq({ testProp: null });
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
		expect(result.component.getArguments()).deep.eq({ testProp: null });
	});

	it('Optional StringProperty without title', async () => {
		const result = renderSchemaWithSingleProperty({ type: 'string' });
		checkBold(result.getByText('String argument'), false);
		const textbox = result.getByRole('textbox', { name: 'String argument' });
		expect(textbox).toBeDefined();
		expect(result.component.getArguments()).deep.eq({ testProp: null });
	});

	it('StringProperty referenced', async () => {
		const result = renderSchemaWithReferencedProperty({ type: 'string' });
		checkBold(result.getByText('String argument'), false);
		const textbox = result.getByRole('textbox', { name: 'String argument' });
		expect(textbox).toBeDefined();
		expect(result.component.getArguments()).deep.eq({ testProp: null });
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
		expect(result.component.getArguments()).deep.eq({ testProp: null });
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
		expect(result.component.getArguments()).deep.eq({ testProp: null });
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
		expect(result.component.getArguments()).deep.eq({ testProp: null });
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
		expect(result.component.getArguments()).deep.eq({ testProp: null });
	});

	it('BooleanProperty without title', async () => {
		const result = renderSchemaWithSingleProperty({ type: 'boolean' }, false);
		const title = result.getByText('Boolean argument');
		checkBold(title, false);
		expect(title).toBeDefined();
		const checkbox = result.getByRole('checkbox');
		expect(checkbox).toBeDefined();
		expect(result.component.getArguments()).deep.eq({ testProp: null });
	});

	it('BooleanProperty referenced', async () => {
		const result = renderSchemaWithReferencedProperty({ type: 'boolean' });
		const title = result.getByText('Boolean argument');
		checkBold(title, false);
		expect(title).toBeDefined();
		const checkbox = result.getByRole('checkbox');
		expect(checkbox).toBeDefined();
		expect(result.component.getArguments()).deep.eq({ testProp: null });
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
		expect(result.component.getArguments()).deep.eq({ testProp: null });
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
		expect(result.component.getArguments()).deep.eq({ testProp: null });
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
		expect(result.component.getArguments()).deep.eq({ testProp: ['foo', 'bar'] });
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
		const clearBtns = result.getAllByRole('button', { name: 'Clear' });
		expect(clearBtns.length).eq(3);
		expect(result.component.getArguments()).deep.eq({ testProp: [null, null, null] });
		await fireEvent.input(inputs[0], { target: { value: 'foo' } });
		expect(inputs[0].value).eq('foo');
		expect(result.component.getArguments()).deep.eq({ testProp: ['foo', null, null] });
		await fireEvent.click(clearBtns[0]);
		expect(inputs[0].value).eq('');
		expect(result.component.getArguments()).deep.eq({ testProp: [undefined, null, null] });
		const addBtn = result.getByRole('button', { name: 'Add argument to list' });
		expect(addBtn.disabled).toBe(false);
		await fireEvent.click(addBtn);
		expect(result.getAllByRole('button', { name: 'Remove' }).length).eq(4);
		await fireEvent.click(addBtn);
		inputs = result.getAllByRole('textbox');
		expect(inputs.length).eq(5);
		expect(result.component.getArguments()).deep.eq({
			testProp: [undefined, null, null, null, null]
		});
		expect(addBtn.disabled).toBe(true);
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
		expect(result.component.getArguments()).deep.eq({ testProp: [] });
		const addBtn = result.getByRole('button', { name: 'Add argument to list' });
		await fireEvent.click(addBtn);
		await fireEvent.click(addBtn);
		await fireEvent.click(addBtn);
		await fireEvent.click(addBtn);
		inputs = result.queryAllByRole('textbox');
		expect(inputs.length).eq(3);
		expect(result.component.getArguments()).deep.eq({ testProp: [null, null, null] });
	});

	it('Object with additional array propery', async () => {
		const result = renderSchema({
			title: 'Object with additionalProperties',
			type: 'object',
			properties: {
				testProp: {
					title: 'testProp',
					type: 'object',
					additionalProperties: {
						type: 'array',
						items: {
							$ref: '#/definitions/Ref'
						}
					}
				}
			},
			definitions: {
				Ref: {
					title: 'argument',
					type: 'object',
					properties: {
						required_string: {
							title: 'Required String',
							type: 'string'
						},
						optional_number: {
							title: 'Optional Number',
							type: 'integer'
						}
					},
					required: ['required_string']
				}
			}
		});
		expect(result.component.getArguments()).deep.eq({ testProp: {} });
		const input = result.getByRole('textbox');
		await fireEvent.input(input, { target: { value: 'my-key' } });
		const addPropertyBtn = result.getByRole('button', { name: 'Add property' });
		await fireEvent.click(addPropertyBtn);
		expect(result.component.getArguments()).deep.eq({ testProp: { 'my-key': [] } });
		expect(result.queryByText('my-key')).not.null;
		const accordionBtn1 = result.getByRole('button', { name: 'my-key' });
		await fireEvent.click(accordionBtn1);
		const addArgumentBtn = result.getByRole('button', { name: 'Add argument to list' });
		await fireEvent.click(addArgumentBtn);
		expect(result.component.getArguments()).deep.eq({
			testProp: { 'my-key': [{ required_string: null, optional_number: null }] }
		});
		const accordionBtn2 = result.getByRole('button', { name: 'argument' });
		await fireEvent.click(accordionBtn2);
		expect(result.queryByText('Required String')).not.null;
		checkBold(result.getByText('Required String'), true);
		checkBold(result.getByText('Optional Number'), false);
		const removeArgumentBtn = result.getByRole('button', { name: 'Remove' });
		await fireEvent.click(removeArgumentBtn);
		expect(result.component.getArguments()).deep.eq({ testProp: { 'my-key': [] } });
		expect(result.queryByText('Required String')).null;
		const removePropertyBtn = result.getByRole('button', { name: 'Remove Property Block' });
		await fireEvent.click(removePropertyBtn);
		expect(result.queryByText('my-key')).null;
		expect(result.component.getArguments()).deep.eq({ testProp: {} });
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

		expect(result.component.getArguments()).deep.eq({
			requiredReferencedProperty: {
				ref1OptionalString: null,
				ref1RequiredArray: [],
				ref1RequiredString: null
			},
			optionalArray: []
		});

		// Insert element into first array
		let addBtn = result.getAllByRole('button', { name: 'Add argument to list' })[0];
		await fireEvent.click(addBtn);

		expect(result.component.getArguments()).deep.eq({
			requiredReferencedProperty: {
				ref1RequiredArray: [{ ref2RequiredString: null, ref2OptionalString: null }],
				ref1RequiredString: null,
				ref1OptionalString: null
			},
			optionalArray: []
		});

		// Insert element into optional array
		addBtn = result.getAllByRole('button', { name: 'Add argument to list' })[1];
		await fireEvent.click(addBtn);

		expect(result.component.getArguments()).deep.eq({
			requiredReferencedProperty: {
				ref1RequiredArray: [{ ref2RequiredString: null, ref2OptionalString: null }],
				ref1RequiredString: null,
				ref1OptionalString: null
			},
			optionalArray: [{ array1RequiredInteger: null, array1OptionalInteger: null }]
		});

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

	it('allOf property with single $ref', async () => {
		const result = renderSchema({
			title: 'TaskFunction3',
			type: 'object',
			properties: {
				normalizer: {
					title: 'Normalizer',
					default: {
						type: 'B'
					},
					allOf: [
						{
							$ref: '#/definitions/Normalizer'
						}
					]
				}
			},
			additionalProperties: false,
			definitions: {
				Normalizer: {
					title: 'Normalizer',
					type: 'object',
					properties: {
						type: {
							title: 'Type',
							enum: ['A', 'B'],
							type: 'string'
						}
					}
				}
			}
		});

		const dropdown = result.getByRole('combobox');
		expect(dropdown.options.length).eq(3);
		expect(dropdown.options[0].text).eq('Select...');
		expect(dropdown.options[1].text).eq('A');
		expect(dropdown.options[2].text).eq('B');
		expect(dropdown.value).eq('B');

		expect(result.component.getArguments()).deep.eq({ normalizer: { type: 'B' } });
	});

	it('allOf property with multiple $ref', async () => {
		const result = renderSchema({
			title: 'TaskFunction3',
			type: 'object',
			properties: {
				normalizer: {
					title: 'Normalizer',
					default: {
						type1: 'A'
					},
					allOf: [{ $ref: '#/definitions/Normalizer1' }, { $ref: '#/definitions/Normalizer2' }]
				}
			},
			additionalProperties: false,
			definitions: {
				Normalizer1: {
					title: 'Normalizer1',
					type: 'object',
					properties: {
						type1: {
							title: 'Type1',
							default: 'A',
							enum: ['A', 'B'],
							type: 'string'
						}
					}
				},
				Normalizer2: {
					title: 'Normalizer2',
					type: 'object',
					properties: {
						type2: {
							title: 'Type2',
							default: 'D',
							enum: ['C', 'D'],
							type: 'string'
						}
					}
				}
			}
		});

		const dropdowns = result.getAllByRole('combobox');
		expect(dropdowns.length).eq(2);
		const [dropdown1, dropdown2] = dropdowns;
		expect(dropdown1.options.length).eq(3);
		expect(dropdown1.options[0].text).eq('Select...');
		expect(dropdown1.options[1].text).eq('A');
		expect(dropdown1.options[2].text).eq('B');
		expect(dropdown1.value).eq('A');
		expect(dropdown2.options[0].text).eq('Select...');
		expect(dropdown2.options[1].text).eq('C');
		expect(dropdown2.options[2].text).eq('D');
		expect(dropdown2.value).eq('D');

		expect(result.component.getArguments()).deep.eq({ normalizer: { type1: 'A', type2: 'D' } });
	});

	it('allOf property with multiple inline schemas', async () => {
		const result = renderSchema({
			title: 'allOf test',
			type: 'object',
			properties: {
				myNumber: {
					title: 'My Number',
					allOf: [
						{ type: 'number', minimum: 5 },
						{ type: 'number', maximum: 10 }
					]
				}
			}
		});

		const input = result.getByRole('spinbutton');
		expect(input.getAttribute('min')).eq('5');
		expect(input.getAttribute('max')).eq('10');

		expect(result.component.getArguments()).deep.eq({ myNumber: null });
	});

	it('enum without type', async () => {
		const result = renderSchema({
			title: 'TaskFunction2',
			type: 'object',
			properties: {
				arg2: {
					$ref: '#/definitions/Color',
					title: 'Arg2',
					description: 'Description of arg2.'
				}
			},
			required: ['arg2'],
			additionalProperties: false,
			definitions: {
				Color: {
					title: 'Color',
					description: 'An enumeration.',
					enum: [1, 2]
				}
			}
		});

		const dropdowns = result.getAllByRole('combobox');
		expect(dropdowns.length).eq(1);
		const [dropdown] = dropdowns;
		expect(dropdown.options.length).eq(3);
		expect(dropdown.options[0].text).eq('Select...');
		expect(dropdown.options[1].text).eq('1');
		expect(dropdown.options[2].text).eq('2');

		expect(result.component.getArguments()).deep.eq({ arg2: null });
	});

	it('optional tuple with default values', async function () {
		const result = renderSchema({
			title: 'test',
			type: 'object',
			properties: {
				patch_size: {
					title: 'Patch Size',
					default: [1300, 'foo', 1],
					type: 'array',
					minItems: 3,
					maxItems: 3,
					items: [
						{
							type: 'integer'
						},
						{
							type: 'string'
						},
						{
							type: 'integer'
						}
					]
				}
			}
		});

		expect(result.component.getArguments()).deep.eq({ patch_size: [1300, 'foo', 1] });

		let inputs = result.getAllByRole('spinbutton');
		expect(inputs.length).eq(2);
		expect(inputs[0].value).eq('1300');
		expect(result.getByRole('textbox').value).eq('foo');
		expect(inputs[1].value).eq('1');
		await fireEvent.input(inputs[0], { target: { value: '500' } });
		expect(inputs[0].value).eq('500');
		const removeTupleBtn = result.getByRole('button', { name: 'Remove tuple' });
		await fireEvent.click(removeTupleBtn);

		expect(result.component.getArguments()).deep.eq({ patch_size: [] });

		expect(result.queryAllByRole('spinbutton').length).eq(0);
		expect(result.queryAllByRole('textbox').length).eq(0);
		const addTupleBtn = result.getByRole('button', { name: 'Add tuple' });
		await fireEvent.click(addTupleBtn);

		// verify that value has been reset to default
		expect(result.component.getArguments()).deep.eq({ patch_size: [1300, 'foo', 1] });

		expect(result.getAllByRole('button', { name: 'Clear' }).length).eq(3);
		inputs = result.getAllByRole('spinbutton');
		expect(inputs.length).eq(2);
		expect(inputs[0].value).eq('1300');
		expect(result.getByRole('textbox').value).eq('foo');
		expect(inputs[1].value).eq('1');
		await fireEvent.click(result.getAllByRole('button', { name: 'Clear' })[0]);
		expect(inputs[0].value).eq('');
	});

	it('optional tuple without default values', async function () {
		const result = renderSchema({
			title: 'test',
			type: 'object',
			properties: {
				patch_size: {
					title: 'Patch Size',
					type: 'array',
					minItems: 2,
					maxItems: 2,
					items: [
						{
							type: 'string'
						},
						{
							type: 'string'
						}
					]
				}
			}
		});

		expect(result.component.getArguments()).deep.eq({ patch_size: [] });

		expect(result.queryAllByRole('textbox').length).eq(0);
		await fireEvent.click(result.getByRole('button', { name: 'Add tuple' }));
		let inputs = result.getAllByRole('textbox');
		expect(inputs.length).eq(2);
		expect(inputs[0].value).eq('');
		expect(inputs[1].value).eq('');

		expect(result.component.getArguments()).deep.eq({ patch_size: [null, null] });

		await fireEvent.input(inputs[0], { target: { value: 'foo' } });
		expect(inputs[0].value).eq('foo');

		expect(result.component.getArguments()).deep.eq({ patch_size: ['foo', null] });

		const removeTupleBtn = result.getByRole('button', { name: 'Remove tuple' });
		await fireEvent.click(removeTupleBtn);
		expect(result.queryAllByRole('textbox').length).eq(0);

		expect(result.component.getArguments()).deep.eq({ patch_size: [] });

		await fireEvent.click(result.getByRole('button', { name: 'Add tuple' }));
		inputs = result.getAllByRole('textbox');
		expect(inputs.length).eq(2);
		expect(inputs[0].value).eq(''); // verify that value has been reset
		expect(inputs[1].value).eq('');

		expect(result.component.getArguments()).deep.eq({ patch_size: [null, null] });

		await fireEvent.input(inputs[1], { target: { value: 'bar' } });
		expect(inputs[1].value).eq('bar');
		expect(result.component.getArguments()).deep.eq({ patch_size: [null, 'bar'] });
		await fireEvent.click(result.getAllByRole('button', { name: 'Clear' })[1]);
		expect(inputs[1].value).eq('');
		expect(result.component.getArguments()).deep.eq({ patch_size: [null, undefined] });
	});

	it('required tuple with default values', async function () {
		const result = renderSchema({
			title: 'test',
			type: 'object',
			properties: {
				patch_size: {
					title: 'Patch Size',
					default: [1300, 1500, 1],
					type: 'array',
					minItems: 3,
					maxItems: 3,
					items: [
						{
							type: 'integer'
						},
						{
							type: 'integer'
						},
						{
							type: 'integer'
						}
					]
				}
			},
			required: ['patch_size']
		});

		expect(result.component.getArguments()).deep.eq({ patch_size: [1300, 1500, 1] });

		const inputs = result.getAllByRole('spinbutton');
		expect(inputs.length).eq(3);
		expect(inputs[0].value).eq('1300');
		expect(inputs[1].value).eq('1500');
		expect(inputs[2].value).eq('1');
		expect(result.queryAllByRole('button', { name: 'Remove tuple' }).length).eq(0);
		await fireEvent.click(result.getAllByRole('button', { name: 'Clear' })[0]);
		expect(inputs[0].value).eq('');
		expect(result.getAllByRole('spinbutton').length).eq(3);
		expect(result.component.getArguments()).deep.eq({ patch_size: [undefined, 1500, 1] });
	});

	it('required tuple without default values', async function () {
		const result = renderSchema({
			title: 'test',
			type: 'object',
			properties: {
				patch_size: {
					title: 'Patch Size',
					type: 'array',
					minItems: 2,
					maxItems: 2,
					items: [
						{
							type: 'string'
						},
						{
							type: 'string'
						}
					]
				}
			},
			required: ['patch_size']
		});

		expect(result.component.getArguments()).deep.eq({ patch_size: [null, null] });

		const inputs = result.getAllByRole('textbox');
		expect(inputs.length).eq(2);
		expect(inputs[0].value).eq('');
		expect(inputs[1].value).eq('');
		expect(result.queryAllByRole('button', { name: 'Remove tuple' }).length).eq(0);
		await fireEvent.input(inputs[0], { target: { value: 'foo' } });
		expect(inputs[0].value).eq('foo');
		expect(result.component.getArguments()).deep.eq({ patch_size: ['foo', null] });
		await fireEvent.click(result.getAllByRole('button', { name: 'Clear' })[0]);
		expect(inputs[0].value).eq('');
		expect(result.component.getArguments()).deep.eq({ patch_size: [undefined, null] });
	});

	it('add array element', async function () {
		const result = renderSchema({
			title: 'test',
			type: 'object',
			properties: {
				test: {
					title: 'Array',
					type: 'array',
					items: {
						type: 'string'
					}
				}
			}
		});

		expect(result.component.getArguments()).deep.eq({ test: [] });
		expect(result.component.unsavedChanges).toEqual(false);
		await fireEvent.click(result.getByRole('button', { name: 'Add argument to list' }));
		expect(result.component.getArguments()).deep.eq({ test: [null] });
		expect(result.component.unsavedChanges).toEqual(true);
	});

	it('remove array element', async function () {
		const result = renderSchema({
			title: 'test',
			type: 'object',
			properties: {
				test: {
					title: 'Array',
					type: 'array',
					default: ['foo'],
					items: {
						type: 'string'
					}
				}
			}
		});

		expect(result.component.getArguments()).deep.eq({ test: ['foo'] });
		expect(result.component.unsavedChanges).toEqual(false);
		await fireEvent.click(result.getByRole('button', { name: 'Remove' }));
		expect(result.component.getArguments()).deep.eq({ test: [] });
		expect(result.component.unsavedChanges).toEqual(true);
	});

	it('add object property', async function () {
		const result = renderSchema({
			title: 'test',
			type: 'object',
			properties: {
				test: {
					title: 'Object',
					type: 'object',
					additionalProperties: {
						type: 'object',
						properties: {
							prop1: {
								type: 'string'
							}
						}
					}
				}
			}
		});

		expect(result.component.getArguments()).deep.eq({ test: {} });
		expect(result.component.unsavedChanges).toEqual(false);
		await fireEvent.input(result.getByPlaceholderText('Key'), {
			target: { value: 'key1' }
		});
		await fireEvent.click(result.getByRole('button', { name: 'Add property' }));
		expect(result.component.getArguments()).deep.eq({ test: { key1: { prop1: null } } });
		expect(result.component.unsavedChanges).toEqual(true);
	});

	it('remove object property', async function () {
		const result = renderSchema({
			title: 'test',
			type: 'object',
			properties: {
				test: {
					title: 'Object',
					type: 'object',
					default: {
						key1: { prop1: 'foo' }
					},
					additionalProperties: {
						type: 'object',
						properties: {
							prop1: {
								type: 'string'
							}
						}
					}
				}
			}
		});

		expect(result.component.getArguments()).deep.eq({ test: { key1: { prop1: 'foo' } } });
		expect(result.component.unsavedChanges).toEqual(false);
		await fireEvent.input(result.getByPlaceholderText('Key'), {
			target: { value: 'key1' }
		});
		await fireEvent.click(result.getByRole('button', { name: 'Remove Property Block' }));
		expect(result.component.getArguments()).deep.eq({ test: {} });
		expect(result.component.unsavedChanges).toEqual(true);
	});

	it('nested tuple', async function () {
		const result = renderSchema({
			title: 'TaskFunction',
			type: 'object',
			properties: {
				arg_A: {
					type: 'array',
					minItems: 1,
					maxItems: 1,
					items: [
						{
							type: 'array',
							minItems: 1,
							maxItems: 1,
							items: [
								{
									type: 'array',
									minItems: 1,
									maxItems: 1,
									items: [
										{
											type: 'string'
										}
									]
								}
							]
						}
					]
				}
			},
			required: ['arg_A'],
			additionalProperties: false
		});

		expect(result.component.getArguments()).deep.eq({ arg_A: [[]] });
		expect(result.component.unsavedChanges).toEqual(false);
		await fireEvent.click(result.getByRole('button', { name: 'Add tuple' }));
		expect(result.component.getArguments()).deep.eq({ arg_A: [[[]]] });
		expect(result.component.unsavedChanges).toEqual(true);
		expect(result.getAllByRole('button', { name: 'Remove tuple' }).length).toEqual(1);
		await fireEvent.click(result.getByRole('button', { name: 'Add tuple' }));
		expect(result.component.getArguments()).deep.eq({ arg_A: [[[null]]] });
		expect(result.getAllByRole('button', { name: 'Remove tuple' }).length).toEqual(2);
		await fireEvent.input(result.getByRole('textbox'), { target: { value: 'foo' } });
		expect(result.component.getArguments()).deep.eq({ arg_A: [[['foo']]] });
		await fireEvent.click(result.getByRole('button', { name: 'Clear' }));
		expect(result.component.getArguments()).deep.eq({ arg_A: [[[undefined]]] });
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
		props: { schema, schemaData, legacy: false }
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
