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
	};

	it('oneOf property', async () => {
		const user = userEvent.setup();

		const { component, onChange } = renderSchema(schema, 'pydantic_v2', {
			proc_step: {
				step: 'ProcessB',
				parameter1: 1
			}
		});

		// Should display the property title
		expect(screen.getByText('Proc Step')).toBeVisible();

		const select = await screen.findByRole('combobox', { name: 'Step' });
		expect(select).toHaveValue('1');
		expect(screen.getByRole('textbox')).toHaveValue('1');
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
		expect(screen.getByRole('textbox')).toHaveValue('');
		expect(component.getArguments()).deep.eq({
			proc_step: {
				step: 'ProcessA',
				parameter1: null
			}
		});
	});

	it('Handle invalid initial discriminator value', async () => {
		const user = userEvent.setup();

		const { component } = renderSchema(schema, 'pydantic_v2', {
			proc_step: { step: 'XXX', foo: 'bar' }
		});

		expect(component.getArguments()).deep.eq({ proc_step: { step: 'XXX', foo: 'bar' } });

		expect(screen.getByRole('textbox', { name: 'foo' })).toHaveValue('bar');
		await user.click(screen.getByRole('button', { name: 'Remove Property Block' }));

		expect(component.getArguments()).deep.eq({ proc_step: { step: 'XXX' } });
		expect(component.isValid()).toEqual(false);

		await user.selectOptions(screen.getByRole('combobox'), 'ProcessB');

		expect(screen.queryAllByText('required property')).toHaveLength(1);
		expect(component.getArguments()).deep.eq({ proc_step: { step: 'ProcessB', parameter1: null } });

		await user.type(screen.getByRole('textbox'), '42');

		expect(component.getArguments()).deep.eq({ proc_step: { step: 'ProcessB', parameter1: 42 } });
		expect(component.isValid()).toEqual(true);
	});

	it('Array with oneOf items', async () => {
		const user = userEvent.setup();

		const { component } = renderSchema({
			$defs: {
				InternalModel1: {
					description: 'Description of InternalModel1.',
					properties: {
						label: {
							const: 'label1',
							default: 'label1',
							title: 'Label',
							type: 'string',
							description: 'FIXME'
						},
						field: {
							default: 1,
							title: 'Field',
							type: 'integer',
							description: 'Missing description'
						}
					},
					title: 'InternalModel1Title',
					type: 'object'
				},
				InternalModel2: {
					description: 'Description of InternalModel2.',
					properties: {
						label: {
							const: 'label2',
							default: 'label2',
							title: 'Label',
							type: 'string',
							description: 'FIXME'
						},
						field: {
							title: 'Field',
							type: 'string',
							description: 'Missing description'
						}
					},
					required: ['field'],
					title: 'InternalModel2Title',
					type: 'object'
				}
			},
			type: 'object',
			properties: {
				foo: {
					default: [],
					items: {
						discriminator: {
							mapping: {
								label1: '#/$defs/InternalModel1',
								label2: '#/$defs/InternalModel2'
							},
							propertyName: 'label'
						},
						oneOf: [
							{
								$ref: '#/$defs/InternalModel1'
							},
							{
								$ref: '#/$defs/InternalModel2'
							}
						]
					},
					title: 'FooTitle',
					type: 'array',
					description: 'Foo Description'
				}
			}
		});

		expect(screen.getByText('FooTitle')).toBeVisible();

		expect(component.getArguments()).deep.eq({ foo: [] });

		await user.click(screen.getByRole('button', { name: 'Add argument to list' }));
		expect(screen.getByRole('button', { name: 'InternalModel1Title' })).toBeVisible();
		await user.selectOptions(screen.getByRole('combobox'), 'label2');

		expect(component.getArguments()).deep.eq({ foo: [{ label: 'label2', field: null }] });

		await user.click(screen.getByRole('button', { name: 'Add argument to list' }));
		expect(screen.getByRole('button', { name: 'InternalModel2Title' })).toBeVisible();

		expect(component.getArguments()).deep.eq({
			foo: [
				{ label: 'label2', field: null },
				{ label: 'label1', field: 1 }
			]
		});

		await user.click(screen.getAllByRole('button', { name: 'Move item up' })[1]);

		expect(component.getArguments()).deep.eq({
			foo: [
				{ label: 'label1', field: 1 },
				{ label: 'label2', field: null }
			]
		});
	});

	it('oneOf items as additionalProperties', async () => {
		const user = userEvent.setup();

		const { component } = renderSchema({
			$defs: {
				InternalModel1: {
					description: 'Description of InternalModel1.',
					properties: {
						label: {
							const: 'label1',
							default: 'label1',
							title: 'Label',
							type: 'string',
							description: 'FIXME'
						},
						field: {
							default: 1,
							title: 'Field',
							type: 'integer',
							description: 'Missing description'
						}
					},
					title: 'InternalModel1Title',
					type: 'object'
				},
				InternalModel2: {
					description: 'Description of InternalModel2.',
					properties: {
						label: {
							const: 'label2',
							default: 'label2',
							title: 'Label',
							type: 'string',
							description: 'FIXME'
						},
						field: {
							title: 'Field',
							type: 'string',
							description: 'Missing description'
						}
					},
					required: ['field'],
					title: 'InternalModel2Title',
					type: 'object'
				}
			},
			type: 'object',
			properties: {
				foo: {
					type: 'object',
					additionalProperties: {
						discriminator: {
							mapping: {
								label1: '#/$defs/InternalModel1',
								label2: '#/$defs/InternalModel2'
							},
							propertyName: 'label'
						},
						oneOf: [
							{
								$ref: '#/$defs/InternalModel1'
							},
							{
								$ref: '#/$defs/InternalModel2'
							}
						]
					},
					title: 'FooTitle',
					description: 'Foo Description'
				}
			}
		});

		expect(screen.getByText('FooTitle')).toBeVisible();

		await user.type(screen.getByPlaceholderText('Key'), 'k1');
		await user.click(screen.getByRole('button', { name: 'Add property' }));

		expect(screen.getByRole('button', { name: 'k1' })).toBeVisible();
		expect(component.getArguments()).deep.eq({ foo: { k1: { label: 'label1', field: 1 } } });

		await user.selectOptions(screen.getByRole('combobox'), 'label2');
		expect(component.getArguments()).deep.eq({ foo: { k1: { label: 'label2', field: null } } });

		expect(screen.getByRole('button', { name: 'k1' })).toBeVisible();
	});

	it('Nested oneOf', async () => {
		const user = userEvent.setup();

		const { component } = renderSchema({
			$defs: {
				InternalModel1: {
					description: 'Description of InternalModel1.',
					properties: {
						label: {
							const: 'label1',
							default: 'label1',
							title: 'Label',
							type: 'string',
							description: 'FIXME'
						},
						field: {
							default: 1,
							title: 'Field',
							type: 'integer',
							description: 'Missing description'
						}
					},
					title: 'InternalModel1Title',
					type: 'object'
				},
				InternalModel2: {
					description: 'Description of InternalModel2.',
					properties: {
						label: {
							const: 'label2',
							default: 'label2',
							title: 'Label',
							type: 'string',
							description: 'FIXME'
						},
						field: {
							title: 'Field',
							type: 'string',
							description: 'Missing description'
						}
					},
					required: ['field'],
					title: 'InternalModel2Title',
					type: 'object'
				}
			},
			type: 'object',
			properties: {
				foo: {
					type: 'object',
					properties: {
						bar: {
							type: 'object',
							title: 'BarTitle',
							discriminator: {
								mapping: {
									label1: '#/$defs/InternalModel1',
									label2: '#/$defs/InternalModel2'
								},
								propertyName: 'label'
							},
							oneOf: [
								{
									$ref: '#/$defs/InternalModel1'
								},
								{
									$ref: '#/$defs/InternalModel2'
								}
							]
						}
					},
					title: 'FooTitle',
					description: 'Foo Description'
				}
			}
		});

		expect(screen.getByText('FooTitle')).toBeVisible();
		expect(screen.getByText('BarTitle')).toBeVisible();

		expect(component.getArguments()).deep.eq({ foo: { bar: { label: 'label1', field: 1 } } });

		await user.selectOptions(screen.getByRole('combobox'), 'label2');
		expect(component.getArguments()).deep.eq({ foo: { bar: { label: 'label2', field: null } } });

		expect(screen.getByText('FooTitle')).toBeVisible();
		expect(screen.getByText('BarTitle')).toBeVisible();
	});

	it('oneOf inside tuple', async () => {
		const user = userEvent.setup();

		const { component } = renderSchema({
			$defs: {
				InternalModel1: {
					properties: {
						label: {
							const: 'label1',
							default: 'label1',
							type: 'string'
						},
						field1: {
							type: 'string'
						}
					},
					required: ['field1'],
					type: 'object'
				},
				InternalModel2: {
					properties: {
						label: {
							const: 'label2',
							default: 'label2',
							type: 'string'
						},
						field2: {
							type: 'string'
						}
					},
					required: ['field2'],
					type: 'object'
				}
			},
			properties: {
				foo: {
					items: {
						type: 'object',
						properties: {
							baz: {
								type: 'array',
								minItems: 2,
								maxItems: 2,
								prefixItems: [
									{
										discriminator: {
											mapping: {
												label1: '#/$defs/InternalModel1',
												label2: '#/$defs/InternalModel2'
											},
											propertyName: 'label'
										},
										oneOf: [
											{
												$ref: '#/$defs/InternalModel1'
											},
											{
												$ref: '#/$defs/InternalModel2'
											}
										]
									},
									{ type: 'number' }
								]
							}
						}
					},
					type: 'array'
				}
			},
			type: 'object'
		});

		expect(component.getArguments()).deep.eq({ foo: [] });

		await user.click(screen.getByRole('button', { name: 'Add argument to list' }));
		await user.click(screen.getByRole('button', { name: 'Add tuple' }));
		expect(component.getArguments()).deep.eq({
			foo: [{ baz: [{ label: 'label1', field1: null }, null] }]
		});

		expect(screen.getByText('must NOT have fewer than 2 items')).toBeVisible();
		expect(screen.getByText('required property')).toBeVisible();

		await user.type(screen.getAllByRole('textbox')[1], '42');
		expect(component.getArguments()).deep.eq({
			foo: [{ baz: [{ label: 'label1', field1: null }, 42] }]
		});
		expect(screen.getByText('required property')).toBeVisible();

		expect(component.isValid()).false;
		await user.type(screen.getByRole('textbox', { name: 'field1' }), 'xxx');
		expect(component.getArguments()).deep.eq({
			foo: [{ baz: [{ label: 'label1', field1: 'xxx' }, 42] }]
		});
		expect(component.isValid()).true;

		await user.selectOptions(screen.getByRole('combobox'), 'label2');
		expect(component.isValid()).false;
		expect(component.getArguments()).deep.eq({
			foo: [{ baz: [{ label: 'label2', field2: null }, 42] }]
		});
		expect(screen.getByText('required property')).toBeVisible();
	});

	it('oneOf with default value and reset', async () => {
		const user = userEvent.setup();

		const { component } = renderSchema({
			$defs: {
				CreateMaskingRoiTable: {
					properties: {
						mode: {
							const: 'create',
							default: 'create',
							type: 'string'
						},
						table_name: {
							default: 'table_name_default',
							type: 'string'
						}
					},
					type: 'object'
				},
				SkipCreateMaskingRoiTable: {
					properties: {
						mode: {
							const: 'skip',
							default: 'skip',
							type: 'string'
						}
					},
					type: 'object'
				}
			},
			type: 'object',
			properties: {
				foo: {
					default: {
						mode: 'skip'
					},
					discriminator: {
						mapping: {
							create: '#/$defs/CreateMaskingRoiTable',
							skip: '#/$defs/SkipCreateMaskingRoiTable'
						},
						propertyName: 'mode'
					},
					oneOf: [
						{
							$ref: '#/$defs/CreateMaskingRoiTable'
						},
						{
							$ref: '#/$defs/SkipCreateMaskingRoiTable'
						}
					]
				}
			}
		});

		expect(component.getArguments()).deep.eq({ foo: { mode: 'skip' } });

		await user.selectOptions(screen.getByRole('combobox', { name: 'mode' }), 'create');

		expect(component.getArguments()).deep.eq({
			foo: {
				table_name: 'table_name_default',
				mode: 'create'
			}
		});

		await user.click(screen.getByRole('button', { name: 'Reset' }));

		expect(component.getArguments()).deep.eq({ foo: { mode: 'skip' } });

		await user.selectOptions(screen.getByRole('combobox', { name: 'mode' }), 'create');

		expect(component.getArguments()).deep.eq({
			foo: {
				table_name: 'table_name_default',
				mode: 'create'
			}
		});
	});
});
