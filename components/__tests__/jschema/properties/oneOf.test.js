import { describe, it, expect, vi } from 'vitest';
import { renderSchema } from './property_test_utils';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/svelte';
import { FormManager } from '../../../src/lib/jschema/form_manager';
import { get } from 'svelte/store';

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
});
