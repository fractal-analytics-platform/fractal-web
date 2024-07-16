import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/svelte';
import { checkBold, renderSchema } from './property_test_utils';

describe('Object properties', () => {
	it('Required nested objects', async () => {
		const { component, onChange } = renderSchema({
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
		const { component, onChange } = renderSchema({
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

		expect(component.getArguments()).deep.eq({ test: {} });
		expect(component.unsavedChanges).toEqual(false);
		await fireEvent.input(screen.getByPlaceholderText('Key'), {
			target: { value: 'key1' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add property' }));
		expect(component.getArguments()).deep.eq({ test: { key1: { prop1: null } } });
		expect(component.unsavedChanges).toEqual(true);
		expect(onChange).toHaveBeenCalledWith({ test: { key1: { prop1: null } } });
	});

	it('remove default additional object property', async function () {
		const { component, onChange } = renderSchema({
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

		expect(component.getArguments()).deep.eq({ test: { key1: { prop1: 'foo' } } });
		expect(component.unsavedChanges).toEqual(false);
		await fireEvent.click(screen.getByRole('button', { name: 'Remove Property Block' }));
		expect(onChange).toHaveBeenCalledWith({ test: {} });
		expect(component.unsavedChanges).toEqual(true);
	});

	it('add and remove additional object property', async function () {
		const { component, onChange } = renderSchema({
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

		expect(component.getArguments()).deep.eq({ test: {} });
		expect(component.unsavedChanges).toEqual(false);
		await fireEvent.input(screen.getByPlaceholderText('Key'), {
			target: { value: 'key1' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Add property' }));
		expect(component.unsavedChanges).toEqual(true);
		expect(component.getArguments()).deep.eq({ test: { key1: { prop1: null } } });
		await fireEvent.input(screen.getAllByRole('textbox')[1], {
			target: { value: 'foo' }
		});
		expect(component.getArguments()).deep.eq({ test: { key1: { prop1: 'foo' } } });
		await fireEvent.click(screen.getByRole('button', { name: 'Remove Property Block' }));
		expect(onChange).toHaveBeenCalledWith({ test: {} });
	});

	it('Object with additional properties and default value', async function () {
		const { component, onChange } = renderSchema({
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
		});

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
			{ k1: 'foo', k2: 'bar' }
		);
		expect(component.getArguments()).deep.eq({ k1: 'foo', k2: 'bar' });
		expect(screen.queryByText('k1')).not.toBeNull();
		expect(screen.queryByText('k2')).not.toBeNull();
	});
});
