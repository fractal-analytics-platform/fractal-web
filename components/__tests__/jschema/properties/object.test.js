import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/svelte';
import { checkBold, renderSchema } from './property_test_utils';
import userEvent from '@testing-library/user-event';

describe('Object properties', () => {
	it('Required nested objects', async () => {
		const { component, onChange } = renderSchema(
			{
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
			},
			'pydantic_v1'
		);

		expect(component.getArguments()).deep.eq({
			requiredReferencedProperty: {
				ref1OptionalString: null,
				ref1RequiredArray: [],
				ref1RequiredString: null
			},
			optionalArray: []
		});

		// Insert element into first array
		let addBtn = screen.getAllByRole('button', { name: 'Add argument to list' })[0];
		await fireEvent.click(addBtn);

		expect(onChange).toHaveBeenCalledWith({
			requiredReferencedProperty: {
				ref1RequiredArray: [{ ref2RequiredString: null, ref2OptionalString: null }],
				ref1RequiredString: null,
				ref1OptionalString: null
			},
			optionalArray: []
		});

		// Insert element into optional array
		addBtn = screen.getAllByRole('button', { name: 'Add argument to list' })[1];
		await fireEvent.click(addBtn);

		expect(onChange).toHaveBeenCalledWith({
			requiredReferencedProperty: {
				ref1RequiredArray: [{ ref2RequiredString: null, ref2OptionalString: null }],
				ref1RequiredString: null,
				ref1OptionalString: null
			},
			optionalArray: [{ array1RequiredInteger: null, array1OptionalInteger: null }]
		});

		checkBold(screen.getByText('Ref1'), true);
		checkBold(screen.getByText('array1 (optional)'), false);
		checkBold(screen.getByText('array1RequiredInteger'), true);
		checkBold(screen.getByText('array1OptionalInteger'), false);
		checkBold(screen.getByText('ref1RequiredArray'), true);
		checkBold(screen.getByText('ref1RequiredString'), true);
		checkBold(screen.getByText('ref1OptionalString'), false);
		checkBold(screen.getByText('ref2RequiredString'), true);
		checkBold(screen.getByText('ref2OptionalString'), false);
	});

	it('add object property', async function () {
		const { component, onChange } = renderSchema(
			{
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
			},
			'pydantic_v1'
		);

		expect(component.getArguments()).deep.eq({ test: {} });
		expect(component.hasUnsavedChanges()).toEqual(false);
		await fireEvent.input(screen.getByPlaceholderText('Key'), {
			target: { value: 'key1' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add property' }));
		expect(component.getArguments()).deep.eq({ test: { key1: { prop1: null } } });
		expect(component.hasUnsavedChanges()).toEqual(true);
		expect(onChange).toHaveBeenCalledWith({ test: { key1: { prop1: null } } });
	});

	it('remove default additional object property', async function () {
		const { component, onChange } = renderSchema(
			{
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
			},
			'pydantic_v1'
		);

		expect(component.getArguments()).deep.eq({ test: { key1: { prop1: 'foo' } } });
		expect(component.hasUnsavedChanges()).toEqual(false);
		await fireEvent.click(screen.getByRole('button', { name: 'Remove Property Block' }));
		expect(onChange).toHaveBeenCalledWith({ test: {} });
		expect(component.hasUnsavedChanges()).toEqual(true);
	});

	it('add and remove additional object property', async function () {
		const { component, onChange } = renderSchema(
			{
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
			},
			'pydantic_v1'
		);

		expect(component.getArguments()).deep.eq({ test: {} });
		expect(component.hasUnsavedChanges()).toEqual(false);
		await fireEvent.input(screen.getByPlaceholderText('Key'), {
			target: { value: 'key1' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add property' }));
		expect(component.hasUnsavedChanges()).toEqual(true);
		expect(component.getArguments()).deep.eq({ test: { key1: { prop1: null } } });
		await fireEvent.input(screen.getAllByRole('textbox')[0], {
			target: { value: 'foo' }
		});
		expect(component.getArguments()).deep.eq({ test: { key1: { prop1: 'foo' } } });
		await fireEvent.click(screen.getByRole('button', { name: 'Remove Property Block' }));
		expect(onChange).toHaveBeenCalledWith({ test: {} });
	});

	it('Object with additional properties and default value', async function () {
		const { component, onChange } = renderSchema(
			{
				title: 'test',
				type: 'object',
				properties: {
					test: {
						default: { key1: 'foo' },
						type: 'object',
						additionalProperties: {
							type: 'string'
						}
					}
				}
			},
			'pydantic_v1'
		);

		expect(component.getArguments()).deep.eq({ test: { key1: 'foo' } });
		await fireEvent.input(screen.getByPlaceholderText('Key'), {
			target: { value: 'key2' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add property' }));
		expect(onChange).toHaveBeenCalledWith({ test: { key1: 'foo', key2: null } });
		const inputs = screen.getAllByRole('textbox');
		expect(inputs.length).eq(3);
		expect(screen.getByRole('textbox', { name: 'key1' })).toHaveValue('foo');
		expect(screen.getByRole('textbox', { name: 'key2' })).toHaveValue('');
	});

	it('Display object with custom key and title - key prevails over title', async function () {
		const { component } = renderSchema(
			{
				type: 'object',
				properties: {
					map: {
						type: 'object',
						additionalProperties: {
							type: 'object',
							title: 'PropertyTitle',
							properties: {
								test: {
									type: 'string'
								}
							}
						}
					}
				}
			},
			'pydantic_v1',
			{ map: { k1: { test: 'foo' } } }
		);
		expect(component.getArguments()).deep.eq({ map: { k1: { test: 'foo' } } });
		expect(screen.queryByText('PropertyTitle')).toBeNull();
		expect(screen.queryByText('k1')).not.toBeNull();
	});

	it('Display root schema having only additionalProperties', async function () {
		const { component } = renderSchema(
			{
				type: 'object',
				additionalProperties: {
					type: 'string'
				}
			},
			'pydantic_v1',
			{ k1: 'foo', k2: 'bar' }
		);
		expect(component.getArguments()).deep.eq({ k1: 'foo', k2: 'bar' });
		expect(screen.queryByText('k1')).not.toBeNull();
		expect(screen.queryByText('k2')).not.toBeNull();
	});

	it('Handle generic object additionalProperties', async function () {
		const user = userEvent.setup();
		const { component } = renderSchema(
			{ type: 'object' },
			'pydantic_v1',
			{ k1: 'foo', k2: 'bar' }
		);
		expect(component.getArguments()).deep.eq({ k1: 'foo', k2: 'bar' });
		expect(component.isValid()).toEqual(true);
		await user.type(screen.getByRole('textbox', { name: 'k1' }), 'x');
		await user.type(screen.getByRole('textbox', { name: 'k2' }), 'y');
		expect(component.getArguments()).deep.eq({ k1: 'foox', k2: 'bary' });
		expect(component.isValid()).toEqual(true);
		await user.click(screen.getAllByRole('button', { name: 'Remove Property Block' })[0]);
		await user.click(screen.getAllByRole('button', { name: 'Remove Property Block' })[0]);
		expect(component.getArguments()).deep.eq({});
		expect(component.isValid()).toEqual(true);
	});

	it('Attempt to add the same object key twice', async function () {
		const user = userEvent.setup();
		const { component } = renderSchema({
			properties: {
				"object_arg": {
					"additionalProperties": {
						"type": "boolean"
					},
					"type": "object"
				},
			},
			type: 'object'
		}, 'pydantic_v2');

		expect(component.getArguments()).deep.eq({ object_arg: {} });

		await user.type(screen.getByRole('textbox'), 'foo');
		await user.click(screen.getByRole('button', { name: 'Add property' }));
		expect(screen.getByRole('textbox')).toHaveValue('');
		await user.click(screen.getByRole('switch'));
		expect(component.getArguments()).deep.eq({ object_arg: { foo: true } });

		await user.type(screen.getByRole('textbox'), 'foo');
		await user.click(screen.getByRole('button', { name: 'Add property' }));
		expect(screen.queryByText('Schema property already has a property with the same name')).not.toBeNull();

		await user.clear(screen.getByRole('textbox'));
		expect(screen.queryByText('Schema property already has a property with the same name')).toBeNull();

		await user.click(screen.getByRole('button', { name: 'Add property' }));
		expect(screen.queryByText('Schema property has no name')).not.toBeNull();

		await user.type(screen.getByRole('textbox'), 'bar');
		expect(screen.queryByText('Schema property has no name')).toBeNull();
		await user.click(screen.getByRole('button', { name: 'Add property' }));
		expect(screen.getByRole('textbox')).toHaveValue('');
	});
});
