import { describe, it, expect, vi } from 'vitest';
import { FormManager } from '../../src/lib/jschema/form_manager';
import { get } from 'svelte/store';

describe('JSchema form errors', () => {
	it('missing required child value (object)', () => {
		const formManager = new FormManager(
			{
				type: 'object',
				properties: {
					foo: {
						type: 'object',
						properties: {
							bar: { type: 'string' }
						}
					}
				},
				required: ['foo']
			},
			vi.fn(),
			'pydantic_v2'
		);
		const errors = get(formManager.root.children[0].errors);
		expect(errors).deep.eq(['missing required child value']);
	});

	it('missingProperty error is set to child element', () => {
		const formManager = new FormManager(
			{
				type: 'object',
				properties: {
					foo: {
						type: 'array',
						items: { type: 'string' }
					}
				},
				required: ['foo']
			},
			vi.fn(),
			'pydantic_v2'
		);
		expect(formManager.getFormData()).deep.eq({ foo: [] });
		const errors = get(formManager.root.children[0].errors);
		expect(errors).deep.eq(["must have required property 'foo'"]);
	});

	it('missing required child value (array)', () => {
		const formManager = new FormManager(
			{
				type: 'object',
				properties: {
					foo: {
						type: 'array',
						items: { type: 'string' }
					}
				},
				required: ['foo']
			},
			vi.fn(),
			'pydantic_v2',
			[],
			{ foo: [null] }
		);
		expect(formManager.getFormData()).deep.eq({ foo: [null] });
		const errors = get(formManager.root.children[0].errors);
		expect(errors).deep.eq(['missing required child value']);
	});

	it('additionalProperty error is set to child element', () => {
		const formManager = new FormManager(
			{
				type: 'object',
				properties: {
					foo: {
						type: 'object',
						properties: {
							bar: { type: 'string' }
						},
						additionalProperties: false
					}
				},
				required: ['foo']
			},
			vi.fn(),
			'pydantic_v2',
			[],
			{
				foo: {
					bar: 'abc',
					baz: 'xxx'
				}
			}
		);
		const errors = get(formManager.root.children[0].children[1].errors);
		expect(errors).deep.eq(['must NOT have additional properties']);
	});

	const oneOfSchema = {
		$defs: {
			A: {
				type: 'object',
				properties: {
					discr: { type: 'string', const: 'A' },
					a: { type: 'string' }
				},
				required: ['discr', 'a']
			},
			B: {
				type: 'object',
				properties: {
					discr: { type: 'string', const: 'B' },
					b: { type: 'string' }
				},
				required: ['discr', 'b']
			}
		},
		type: 'object',
		properties: {
			foo: {
				discriminator: {
					mapping: {
						A: '#/$defs/A',
						B: '#/$defs/B'
					},
					propertyName: 'discr'
				},
				oneOf: [{ $ref: '#/$defs/A' }, { $ref: '#/$defs/B' }]
			}
		},
		required: ['foo']
	};

	it('oneOf errors with valid discriminator', () => {
		const formManager = new FormManager(oneOfSchema, vi.fn(), 'pydantic_v2');

		expect(formManager.getFormData()).deep.eq({ foo: { a: null, discr: 'A' } });

		const foo = formManager.root.children[0];

		expect(get(foo.errors)).deep.eq([]);
		expect(get(foo.selectedItem.errors)).deep.eq([]);
		expect(get(foo.selectedItem.children[0].errors)).deep.eq(['required property']);
	});

	it('oneOf errors with invalid discriminator', () => {
		const formManager = new FormManager(oneOfSchema, vi.fn(), 'pydantic_v2', [], {
			foo: { discr: 'X', u: 'U' }
		});
		expect(formManager.getFormData()).deep.eq({ foo: { discr: 'X', u: 'U' } });
		const foo = formManager.root.children[0];
		expect(get(foo.errors)).deep.eq([]);
		expect(foo.selectedItem).null;
	});

	it('oneOf errors with array (nested tagged union)', async () => {
		const schema = {
			$defs: {
				InternalModel1: {
					properties: {
						label: {
							const: 'label1',
							default: 'label1',
							type: 'string'
						},
						field: {
							default: 1,
							type: 'integer'
						}
					},
					type: 'object'
				},
				InternalModel2: {
					properties: {
						label: {
							const: 'label2',
							default: 'label2',
							type: 'string'
						},
						field: { type: 'string' }
					},
					required: ['field'],
					type: 'object'
				},
				InternalModel3: {
					properties: {
						label: {
							const: 'label3',
							default: 'label3',
							type: 'string'
						},
						field3: { type: 'string' }
					},
					required: ['field3'],
					type: 'object'
				}
			},
			properties: {
				foo: {
					items: {
						discriminator: {
							mapping: {
								label1: '#/$defs/InternalModel1',
								label2: '#/$defs/InternalModel2',
								label3: '#/$defs/InternalModel3'
							},
							propertyName: 'label'
						},
						oneOf: [
							{
								$ref: '#/$defs/InternalModel1'
							},
							{
								$ref: '#/$defs/InternalModel2'
							},
							{
								$ref: '#/$defs/InternalModel3'
							}
						]
					},
					title: 'Nested Tagged Union',
					type: 'array'
				}
			},
			type: 'object'
		};

		const formManager = new FormManager(schema, vi.fn(), 'pydantic_v2', [], {
			foo: [{ label: 'label2' }]
		});

		expect(formManager.getFormData()).deep.eq({ foo: [{ label: 'label2', field: null }] });
		expect(get(formManager.genericErrors).length).eq(0);
		expect(get(formManager.root.children[0].children[0].errors)).deep.eq([]);
		expect(get(formManager.root.children[0].children[0].selectedItem.children[0].errors)).deep.eq([
			'required property'
		]);
	});

	it('oneOf errors with deeply nested array', async () => {
		const schema = {
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
								}
							}
						}
					},
					title: 'Deeply Nested Tagged Union',
					type: 'array'
				}
			},
			type: 'object'
		};

		const formManager = new FormManager(schema, vi.fn(), 'pydantic_v2', [], {
			foo: [{ baz: [{ label: 'label1' }] }]
		});

		expect(formManager.getFormData()).deep.eq({
			foo: [{ baz: [{ label: 'label1', field1: null }] }]
		});
		expect(get(formManager.genericErrors).length).eq(0);

		expect(get(formManager.root.children[0].children[0].children[0].children[0].errors)).deep.eq(
			[]
		);
		expect(
			get(
				formManager.root.children[0].children[0].children[0].children[0].selectedItem.children[0]
					.errors
			)
		).deep.eq(['required property']);
	});

	it('oneOf errors inside tuple', async () => {
		const schema = {
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
									{ type: 'string' }
								]
							}
						}
					},
					type: 'array'
				}
			},
			type: 'object'
		};

		const formManager = new FormManager(schema, vi.fn(), 'pydantic_v2', [], {
			foo: [{ baz: [{ label: 'label1' }] }]
		});

		expect(formManager.getFormData()).deep.eq({
			foo: [{ baz: [{ label: 'label1', field1: null }, null] }]
		});
		expect(get(formManager.genericErrors).length).eq(0);

		expect(get(formManager.root.children[0].children[0].children[0].errors)).deep.eq([
			'must NOT have fewer than 2 items'
		]);
		expect(get(formManager.root.children[0].children[0].children[0].children[0].errors)).deep.eq(
			[]
		);
		expect(
			get(formManager.root.children[0].children[0].children[0].children[0].selectedItem.errors)
		).deep.eq([]);
		expect(
			get(
				formManager.root.children[0].children[0].children[0].children[0].selectedItem.children[0]
					.errors
			)
		).deep.eq(['required property']);
	});

	it('should ignore null enum errors', () => {
		const formManager = new FormManager(
			{
				type: 'object',
				properties: {
					foo: {
						type: 'string',
						enum: ['option1', 'option2']
					}
				},
				required: ['foo']
			},
			vi.fn(),
			'fractal_schema_v1'
		);
		const errors = get(formManager.root.children[0].errors);
		expect(errors).deep.eq(['must be equal to one of the allowed values']);
	});

	it('handle invalid field in anyOf when the same model is referenced in a oneOf property', () => {
		const formManager = new FormManager(
			{
				$defs: {
					InternalModel3: {
						properties: {
							label: {
								const: 'label3',
								default: 'label3',
								type: 'string'
							},
							field: {
								type: 'boolean'
							}
						},
						required: ['field'],
						type: 'object'
					},
					InternalModel4: {
						properties: {
							label: {
								enum: ['label4A', 'label4B'],
								default: 'label4A',
								type: 'string'
							},
							field: {
								default: 1,
								type: 'integer'
							}
						},
						type: 'object'
					}
				},
				type: 'object',
				properties: {
					field_3: {
						anyOf: [
							{
								items: {
									discriminator: {
										mapping: {
											label3: '#/$defs/InternalModel3',
											label4: '#/$defs/InternalModel4'
										},
										propertyName: 'label'
									},
									oneOf: [
										{
											$ref: '#/$defs/InternalModel3'
										},
										{
											$ref: '#/$defs/InternalModel4'
										}
									]
								},
								type: 'array'
							},
							{
								type: 'null'
							}
						],
						default: null
					},
					model_or_none: {
						anyOf: [
							{
								$ref: '#/$defs/InternalModel4'
							},
							{
								type: 'null'
							}
						],
						default: null
					}
				},
				required: ['model_or_none']
			},
			vi.fn(),
			'fractal_schema_v1',
			[],
			{
				field_3: [
					{
						field: true,
						label: 'label3'
					}
				],
				model_or_none: {
					label: 'INVALID',
					field: 1
				}
			}
		);
		expect(formManager.getFormData()).deep.eq({
			field_3: [{ label: 'label3', field: true }],
			model_or_none: { label: 'INVALID', field: 1 }
		});
		const errors = get(formManager.root.children[1].children[0].errors);
		expect(errors).deep.eq(['must be equal to one of the allowed values']);
	});
});
