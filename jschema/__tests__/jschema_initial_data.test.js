import { describe, it, expect } from 'vitest';
import { getJsonSchemaData } from '../src/lib/components/jschema_initial_data';

describe('jschema_intial_data', () => {
	const schema = {
		type: 'object',
		properties: {
			arrayProp: {
				type: 'array',
				items: {
					type: 'string'
				}
			},
			objectProp: {
				type: 'object',
				properties: {
					requiredArrayWithMinItems: {
						type: 'array',
						minItems: 3,
						items: {
							type: 'object',
							properties: {
								k1: {
									type: 'number'
								},
								k2: {
									type: 'array',
									default: [1, 2, 3],
									items: {
										type: 'number'
									}
								},
								k3: {
									type: 'array',
									minItems: 2,
									maxItems: 2,
									items: [
										{
											type: 'boolean',
											default: true
										},
										{
											type: 'object',
											properties: {
												p1: {
													type: 'string',
													default: 'foo'
												}
											}
										}
									]
								},
								k4: {
									type: 'array',
									minItems: 2,
									maxItems: 2,
									items: { type: 'string' }
								},
								k5: {
									type: 'array',
									minItems: 2,
									maxItems: 2,
									items: { type: 'string' }
								}
							},
							required: ['k3', 'k4']
						}
					},
					optionalArrayWithMinItems: {
						type: 'array',
						minItems: 3,
						items: {
							type: 'string'
						}
					}
				},
				required: ['requiredArrayWithMinItems']
			}
		}
	};

	it('Generate default data with undefined initial value', () => {
		const data = getJsonSchemaData(schema, undefined);

		expect(data.arrayProp.length).eq(0);
		expect(data.objectProp.requiredArrayWithMinItems.length).eq(3);
		const reqArrayItem = data.objectProp.requiredArrayWithMinItems[0];
		expect(reqArrayItem.k1).eq(null);
		expect(reqArrayItem.k2).deep.eq([1, 2, 3]);
		expect(reqArrayItem.k3.length).eq(2);
		expect(reqArrayItem.k3[0]).eq(true);
		expect(reqArrayItem.k3[1].p1).eq('foo');
		expect(reqArrayItem.k4.length).eq(2);
		expect(reqArrayItem.k4[0]).eq(null);
		expect(reqArrayItem.k4[1]).eq(null);
		expect(reqArrayItem.k5.length).eq(0);
	});

	it('Fill partially defined initial value', () => {
		const initialValue = {
			arrayProp: ['x'],
			objectProp: {
				requiredArrayWithMinItems: [
					{
						k1: 10,
						k2: [5, 6],
						k3: [null, { p1: 'bar' }],
						k5: ['a', 'b']
					}
				],
				optionalArrayWithMinItems: ['foo']
			}
		};

		const data = getJsonSchemaData(schema, initialValue);

		expect(data.arrayProp.length).eq(1);
		expect(data.arrayProp[0]).eq('x');
		expect(data.objectProp.requiredArrayWithMinItems.length).eq(3);

		const reqArrayItem1 = data.objectProp.requiredArrayWithMinItems[0];
		expect(reqArrayItem1.k1).eq(10);
		expect(reqArrayItem1.k2).deep.eq([5, 6]);
		expect(reqArrayItem1.k3.length).eq(2);
		expect(reqArrayItem1.k3[0]).eq(null);
		expect(reqArrayItem1.k3[1].p1).eq('bar');
		expect(reqArrayItem1.k4.length).eq(2);
		expect(reqArrayItem1.k4[0]).eq(null);
		expect(reqArrayItem1.k4[1]).eq(null);
		expect(reqArrayItem1.k5.length).eq(2);
		expect(reqArrayItem1.k5[0]).eq('a');
		expect(reqArrayItem1.k5[1]).eq('b');

		const reqArrayItem2 = data.objectProp.requiredArrayWithMinItems[1];
		expect(reqArrayItem2.k1).eq(null);
		expect(reqArrayItem2.k2).deep.eq([]);
		expect(reqArrayItem2.k3.length).eq(2);
		expect(reqArrayItem2.k3[0]).eq(null);
		expect(reqArrayItem2.k4.length).eq(2);
		expect(reqArrayItem2.k4[0]).eq(null);
		expect(reqArrayItem2.k4[1]).eq(null);
		expect(reqArrayItem2.k5.length).eq(0);

		expect(data.objectProp.optionalArrayWithMinItems.length).eq(1);
		expect(data.objectProp.optionalArrayWithMinItems[0]).eq('foo');
	});

	it('Fill required fields of array child with partial initial data', () => {
		const data = getJsonSchemaData(
			{
				type: 'object',
				properties: {
					a1: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								p1: { type: 'string' },
								p2: { type: 'string' }
							}
						}
					}
				}
			},
			{ a1: [{ p1: 'foo' }] }
		);

		expect(data.a1.length).eq(1);
		expect(data.a1[0].p1).eq('foo');
		expect(data.a1[0].p2).eq(null);
	});

	it('Fill missing fields of tuple child with partial initial data', () => {
		const data = getJsonSchemaData(
			{
				type: 'object',
				properties: {
					t1: {
						type: 'array',
						minItems: 3,
						maxItems: 3,
						items: {
							type: 'object',
							properties: {
								p1: { type: 'string' },
								p2: { type: 'string' }
							}
						}
					}
				}
			},
			{ t1: [{ p1: 'foo' }, { p2: 'bar' }] }
		);

		expect(data.t1.length).eq(3);
		expect(data.t1[0].p1).eq('foo');
		expect(data.t1[0].p2).eq(null);
		expect(data.t1[1].p1).eq(null);
		expect(data.t1[1].p2).eq('bar');
		expect(data.t1[2].p1).eq(null);
		expect(data.t1[2].p2).eq(null);
	});

	it('Truncates tuple with initial value longer than expected', () => {
		const data = getJsonSchemaData(
			{
				type: 'object',
				properties: {
					t1: {
						type: 'array',
						minItems: 2,
						maxItems: 2,
						items: { type: 'string' }
					}
				}
			},
			{ t1: ['a', 'b', 'c', 'd'] }
		);

		expect(data.t1.length).eq(2);
		expect(data.t1[0]).eq('a');
		expect(data.t1[1]).eq('b');
	});

	it('Fill additional properties', () => {
		const data = getJsonSchemaData(
			{
				type: 'object',
				properties: {
					obj: {
						type: 'object',
						additionalProperties: {
							type: 'object',
							properties: {
								prop1: {
									type: 'string'
								},
								prop2: {
									type: 'string'
								}
							}
						}
					}
				}
			},
			{ obj: { key1: { prop1: 'foo' } } }
		);

		expect(data.obj.key1.prop1).eq('foo');
		expect(data.obj.key1.prop2).eq(null);
	});

	it('Initialize empty object with additional properties', () => {
		const data = getJsonSchemaData(
			{
				type: 'object',
				properties: {
					obj: {
						type: 'object',
						additionalProperties: {
							type: 'string'
						}
					}
				}
			},
			{}
		);

		expect(data).deep.eq({ obj: {} });
	});

	it('Initialize missing default properties for object', () => {
		const data = getJsonSchemaData(
			{
				type: 'object',
				properties: {
					obj: {
						type: 'object',
						default: { prop1: 'foo' },
						properties: {
							prop1: {
								type: 'string'
							},
							prop2: {
								type: 'string'
							}
						}
					}
				}
			},
			undefined
		);

		expect(data.obj.prop1).eq('foo');
		expect(data.obj.prop2).eq(null);
	});

	it('Initialize missing default properties for object with additional properties', () => {
		const data = getJsonSchemaData(
			{
				type: 'object',
				properties: {
					obj: {
						type: 'object',
						default: { key1: { prop1: 'foo' } },
						additionalProperties: {
							type: 'object',
							properties: {
								prop1: {
									type: 'string'
								},
								prop2: {
									type: 'string'
								}
							}
						}
					}
				}
			},
			undefined
		);

		expect(data.obj.key1.prop1).eq('foo');
		expect(data.obj.key1.prop2).eq(null);
	});

	it('Initialize missing default properties for an array of objects', () => {
		const data = getJsonSchemaData(
			{
				type: 'object',
				properties: {
					arr: {
						type: 'array',
						default: [{ prop1: 'foo' }],
						items: {
							type: 'object',
							properties: {
								prop1: {
									type: 'string'
								},
								prop2: {
									type: 'string'
								}
							}
						}
					}
				}
			},
			undefined
		);

		expect(data).deep.eq({ arr: [{ prop1: 'foo', prop2: null }] });
	});

	it('Load tuple default value', () => {
		const data = getJsonSchemaData(
			{
				type: 'object',
				properties: {
					tuple: {
						default: [1, 2],
						type: 'array',
						minItems: 2,
						maxItems: 2,
						items: [
							{
								type: 'integer'
							},
							{
								type: 'integer'
							}
						]
					}
				}
			},
			undefined
		);

		expect(data).deep.eq({ tuple: [1, 2] });
	});

	it('Does not fill optional tuple', () => {
		const data = getJsonSchemaData(
			{
				type: 'object',
				properties: {
					tuple: {
						type: 'array',
						minItems: 1,
						maxItems: 1,
						items: [
							{
								type: 'integer'
							}
						]
					}
				}
			},
			undefined
		);

		expect(data).deep.eq({ tuple: [] });
	});

	it('Fill required tuple', () => {
		const data = getJsonSchemaData(
			{
				type: 'object',
				properties: {
					tuple: {
						type: 'array',
						minItems: 1,
						maxItems: 1,
						items: [
							{
								type: 'integer'
							}
						]
					}
				},
				required: ['tuple']
			},
			undefined
		);

		expect(data).deep.eq({ tuple: [null] });
	});

	it('Does not fill optional tuple child of required tuple', () => {
		const data = getJsonSchemaData(
			{
				type: 'object',
				properties: {
					tuple: {
						type: 'array',
						minItems: 1,
						maxItems: 1,
						items: [
							{
								type: 'array',
								minItems: 1,
								maxItems: 1,
								items: [{ type: 'string' }]
							}
						]
					}
				},
				required: ['tuple']
			},
			undefined
		);

		expect(data).deep.eq({ tuple: [[]] });
	});

	it('Load boolean false value and null value', () => {
		const data = getJsonSchemaData(
			{
				type: 'object',
				properties: {
					b1: { type: 'boolean' },
					b2: { type: 'boolean' }
				}
			},
			{ b1: false }
		);
		expect(data).deep.eq({ b1: false, b2: null });
	});
});
