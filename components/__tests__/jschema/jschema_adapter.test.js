import { describe, it, expect } from 'vitest';
import { adaptJsonSchema, stripDiscriminator } from '../../src/lib/jschema/jschema_adapter';

describe('jschema_adapter', () => {
	it('Adapt discriminators', () => {
		const schema = adaptJsonSchema({
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
		});

		const property = /** @type {any} */ (schema.properties.proc_step);

		const mapping = property.discriminator.mapping;
		expect(mapping.ProcessA).eq(0);
		expect(mapping.ProcessB).eq(1);

		const properties = property.oneOf;
		expect(properties[0].title).eq('ProcessAModel');
		expect(properties[1].title).eq('ProcessBModel');
	});

	it('Replace references', () => {
		const schema = adaptJsonSchema({
			type: 'object',
			properties: {
				simple: {
					type: 'string'
				},
				referenced1: {
					title: 'Referenced 1',
					$ref: '#/definitions/Ref1'
				}
			},
			required: ['referenced1'],
			definitions: {
				Ref1: {
					type: 'object',
					properties: {
						referenced2: {
							type: 'array',
							items: {
								$ref: '#/definitions/Ref2'
							}
						}
					}
				},
				Ref2: {
					title: 'Ref2',
					type: 'object',
					properties: {
						ref2string: {
							type: 'string'
						}
					}
				}
			}
		});

		const simpleProperty =
			/** @type {import('../../src/lib/types/jschema').JSONSchemaStringProperty} */ (
				schema.properties.simple
			);
		const referenced1Property =
			/** @type {import('../../src/lib/types/jschema').JSONSchemaObjectProperty} */ (
				schema.properties.referenced1
			);
		const referenced2Property =
			/** @type {import('../../src/lib/types/jschema').JSONSchemaArrayProperty} */ (
				referenced1Property.properties.referenced2
			);

		const referenced2PropertyItems =
			/** @type {import('../../src/lib/types/jschema').JSONSchemaObjectProperty} */ (
				referenced2Property.items
			);
		const ref2StringProperty =
			/** @type {import('../../src/lib/types/jschema').JSONSchemaStringProperty} */ (
				referenced2PropertyItems.properties.ref2string
			);

		expect(simpleProperty.type).eq('string');
		expect(referenced1Property.title).eq('Referenced 1');
		expect(referenced1Property.type).eq('object');
		expect(referenced2Property.type).eq('array');
		expect(referenced2PropertyItems.type).eq('object');
		expect(ref2StringProperty.type).eq('string');
	});

	it('Merge allOf', () => {
		const schema = adaptJsonSchema({
			type: 'object',
			properties: {
				allOfNumber: {
					title: 'My Number',
					allOf: [
						{ type: 'number', minimum: 5 },
						{ type: 'number', maximum: 10 }
					]
				},
				allOfEnum: {
					allOf: [{ enum: ['A'] }, { enum: ['B'] }]
				},
				allOfObject: {
					allOf: [
						{
							type: 'object',
							default: { k1: 'v1' },
							properties: { k1: { type: 'string' } }
						},
						{
							type: 'object',
							default: { k2: 'v2' },
							properties: { k2: { type: 'string' } }
						}
					]
				}
			}
		});

		expect(schema.properties.allOfNumber.type).eq('number');
		expect(schema.properties.allOfNumber.title).eq('My Number');
		expect(schema.properties.allOfNumber.minimum).eq(5);
		expect(schema.properties.allOfNumber.maximum).eq(10);
		expect(schema.properties.allOfEnum.enum).deep.eq(['A', 'B']);
		expect(schema.properties.allOfObject).deep.eq({
			type: 'object',
			default: { k1: 'v1', k2: 'v2' },
			properties: {
				k1: { type: 'string' },
				k2: { type: 'string' }
			}
		});
	});

	it('Handles null default value', () => {
		const jschema = {
			type: 'object',
			properties: {
				testProp: {
					default: null,
					type: 'string'
				}
			}
		};
		const schema = adaptJsonSchema(jschema);
		expect(schema.properties.testProp.default).toEqual(null);
	});

	it('Strip discriminator', () => {
		const cleanJschema = stripDiscriminator({
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
		});

		expect(JSON.stringify(cleanJschema)).eq(
			JSON.stringify({
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
			})
		);
	});
});
