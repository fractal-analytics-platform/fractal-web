import { describe, it, expect } from 'vitest';
import { adaptJsonSchema } from '../src/lib/components/jschema_adapter';

describe('jschema_adapter', () => {
	it('Replace references', () => {
		const jschema = {
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
		};

		const result = adaptJsonSchema(jschema);

		expect(result.properties.simple.type).eq('string');
		expect(result.properties.referenced1.title).eq('Referenced 1');
		expect(result.properties.referenced1.type).eq('object');
		expect(result.properties.referenced1.properties.referenced2.type).eq('array');
		expect(result.properties.referenced1.properties.referenced2.items.type).eq('object');
		expect(
			result.properties.referenced1.properties.referenced2.items.properties.ref2string.type
		).eq('string');
	});

	it('Merge allOf', () => {
		const jschema = {
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
		};

		const result = adaptJsonSchema(jschema);

		expect(result.properties.allOfNumber.type).eq('number');
		expect(result.properties.allOfNumber.title).eq('My Number');
		expect(result.properties.allOfNumber.minimum).eq(5);
		expect(result.properties.allOfNumber.maximum).eq(10);
		expect(result.properties.allOfEnum.enum).deep.eq(['A', 'B']);
		expect(result.properties.allOfObject).deep.eq({
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
		const result = adaptJsonSchema(jschema);
		expect(result.properties.testProp.default).toEqual(null);
	});
});
