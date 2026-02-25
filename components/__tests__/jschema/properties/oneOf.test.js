import { describe, it, expect } from 'vitest';
import { renderSchema } from './property_test_utils';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/svelte';

describe('oneOf properties', () => {

	const schema = {
		$defs: {
			ProcessAModel: {
				description: 'A process model with the same parameter name as ProcessBModel.',
				properties: {
					step: {
						const: 'ProcessA',
						title: 'Step',
						type: 'string',
						description: 'A literal to identify the process type.'
					},
					parameter1: {
						title: 'Parameter1',
						type: 'number',
						description: 'An integer parameter in A.'
					}
				},
				required: ['step', 'parameter1'],
				title: 'ProcessAModel',
				type: 'object'
			},
			ProcessBModel: {
				description: 'B process model with the same parameter name as ProcessAModel.',
				properties: {
					step: {
						const: 'ProcessB',
						title: 'Step',
						type: 'string',
						description: 'A literal to identify the process type.'
					},
					parameter1: {
						title: 'Parameter1',
						type: 'number',
						description: 'An integer parameter in B.'
					}
				},
				required: ['step', 'parameter1'],
				title: 'ProcessBModel',
				type: 'object'
			}
		},
		additionalProperties: false,
		properties: {
			proc_step: {
				discriminator: {
					mapping: {
						ProcessA: '#/$defs/ProcessAModel',
						ProcessB: '#/$defs/ProcessBModel'
					},
					propertyName: 'step'
				},
				oneOf: [
					{
						$ref: '#/$defs/ProcessAModel'
					},
					{
						$ref: '#/$defs/ProcessBModel'
					}
				],
				title: 'Proc Step',
				description: 'The processing step to apply.'
			}
		},
		required: ['proc_step'],
		type: 'object',
		title: 'ProcessTask'
	}

	it('oneOf property', async () => {
		const user = userEvent.setup();

		const { component, onChange } = renderSchema(
			schema,
			'pydantic_v2',
			{
				proc_step: {
					step: 'ProcessB',
					parameter1: 1
				}
			}
		);

		const select = await screen.findByRole('combobox', { name: 'Step' });
		expect(select).toHaveValue('1');
		expect(screen.getByRole('spinbutton')).toHaveValue(1);
		expect(component.getArguments()).deep.eq({
			proc_step: {
				step: 'ProcessB',
				parameter1: 1
			}
		});

		await user.selectOptions(select, 'ProcessA');
		expect(onChange).toHaveBeenCalledWith({
			proc_step: {
				step: 'ProcessA',
				parameter1: null
			}
		});
		expect(screen.getByRole('spinbutton')).toHaveValue(null);
		expect(component.getArguments()).deep.eq({
			proc_step: {
				step: 'ProcessA',
				parameter1: null
			}
		});
	});

	it('Handle invalid initial discriminator value', async () => {
		const user = userEvent.setup();

		const { component } = renderSchema(
			schema,
			'pydantic_v2',
			{ proc_step: { step: 'XXX', foo: 'bar' } }
		);

		expect(component.getArguments()).deep.eq({ proc_step: { step: 'XXX', foo: 'bar' } });

		expect(screen.queryAllByText("must match exactly one schema in oneOf")).toHaveLength(1);

		expect(screen.getByRole('textbox', { name: 'foo' })).toHaveValue('bar');
		await user.click(screen.getByRole('button', { name: 'Remove Property Block' }));

		expect(component.getArguments()).deep.eq({ proc_step: { step: 'XXX' } });
		expect(component.valid).toEqual(false);

		await user.selectOptions(screen.getByRole('combobox'), 'ProcessB');

		expect(screen.queryAllByText("required property")).toHaveLength(1);
		expect(component.getArguments()).deep.eq({ proc_step: { step: 'ProcessB', parameter1: null } });

		await user.type(screen.getByRole('spinbutton'), '42');

		expect(screen.queryAllByText("must match exactly one schema in oneOf")).toHaveLength(0);
		expect(component.getArguments()).deep.eq({ proc_step: { step: 'ProcessB', parameter1: 42 } });
		expect(component.valid).toEqual(true);
	});

	it('Array with oneOf items - indexes are displayed in the title', async () => {
		const user = userEvent.setup();

		const { component } = renderSchema({
			"$defs": {
				"InternalModel1": {
					"description": "Description of InternalModel1.",
					"properties": {
						"label": {
							"const": "label1",
							"default": "label1",
							"title": "Label",
							"type": "string",
							"description": "FIXME"
						},
						"field": {
							"default": 1,
							"title": "Field",
							"type": "integer",
							"description": "Missing description"
						}
					},
					"title": "InternalModel1Title",
					"type": "object"
				},
				"InternalModel2": {
					"description": "Description of InternalModel2.",
					"properties": {
						"label": {
							"const": "label2",
							"default": "label2",
							"title": "Label",
							"type": "string",
							"description": "FIXME"
						},
						"field": {
							"title": "Field",
							"type": "string",
							"description": "Missing description"
						}
					},
					"required": [
						"field"
					],
					"title": "InternalModel2Title",
					"type": "object"
				}
			},
			"type": "object",
			"properties": {
				"foo": {
					"default": [],
					"items": {
						"discriminator": {
							"mapping": {
								"label1": "#/$defs/InternalModel1",
								"label2": "#/$defs/InternalModel2"
							},
							"propertyName": "label"
						},
						"oneOf": [
							{
								"$ref": "#/$defs/InternalModel1"
							},
							{
								"$ref": "#/$defs/InternalModel2"
							}
						]
					},
					"title": "FooTitle",
					"type": "array",
					"description": "Foo Description"
				}
			}
		});

		expect(screen.getByText('FooTitle')).toBeVisible();

		expect(component.getArguments()).deep.eq({ foo: [] });

		await user.click(screen.getByRole('button', { name: 'Add argument to list' }));
		expect(screen.getByRole('button', { name: '0' })).toBeVisible();
		await user.selectOptions(screen.getByRole('combobox'), 'label2');

		expect(component.getArguments()).deep.eq({ foo: [{ label: 'label2', field: null }] });

		await user.click(screen.getByRole('button', { name: 'Add argument to list' }));
		expect(screen.getByRole('button', { name: '1' })).toBeVisible();

		expect(component.getArguments()).deep.eq({ foo: [{ label: 'label2', field: null }, { label: 'label1', field: 1 }] });

		// Verify that indexes are in the correct order
		expect(screen.getAllByRole('button').map(
			b => b === screen.getByRole('button', { name: '0' }) ? 0 : b === screen.getByRole('button', { name: '1' }) ? 1 : null
		).filter(b => b !== null)).deep.eq([0, 1]);

		await user.click(screen.getAllByRole('button', { name: 'Move item up' })[1]);

		expect(component.getArguments()).deep.eq({ foo: [{ label: 'label1', field: 1 }, { label: 'label2', field: null }] });

		// Verify that indexes have been regenerated in the correct order
		expect(screen.getAllByRole('button').map(
			b => b === screen.getByRole('button', { name: '0' }) ? 0 : b === screen.getByRole('button', { name: '1' }) ? 1 : null
		).filter(b => b !== null)).deep.eq([0, 1]);
	});
});
