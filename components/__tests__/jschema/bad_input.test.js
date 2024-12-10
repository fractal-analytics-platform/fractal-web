import { describe, it, expect, vi } from 'vitest';
import { FormManager } from '../../src/lib/jschema/form_manager';

describe('badInput', () => {
	it('Detect bad input in nested object', () => {
		const manager = new FormManager(
			{
				title: 'test',
				type: 'object',
				properties: {
					foo: {
						type: 'object',
						properties: {
							bar: {
								type: 'number'
							}
						}
					}
				}
			},
			vi.fn(),
			'pydantic_v1'
		);
		expect(manager.getFormData()).deep.eq({ foo: { bar: null } });
		manager.root.children[0].children[0].badInput = true;
		expect(manager.getFormData()).deep.eq({ foo: { bar: 'invalid' } });
	});

	it('Detect bad input in nested array', () => {
		const manager = new FormManager(
			{
				title: 'test',
				type: 'object',
				properties: {
					foo: {
						default: [0],
						type: 'array',
						items: {
							type: 'number'
						}
					}
				}
			},
			vi.fn(),
			'pydantic_v1'
		);
		expect(manager.getFormData()).deep.eq({ foo: [0] });
		manager.root.children[0].children[0].badInput = true;
		expect(manager.getFormData()).deep.eq({ foo: ['invalid'] });
	});

	it('Detect bad input in nested tuple', () => {
		const manager = new FormManager(
			{
				title: 'test',
				type: 'object',
				properties: {
					foo: {
						default: [0],
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
			vi.fn(),
			'pydantic_v1'
		);
		expect(manager.getFormData()).deep.eq({ foo: [0] });
		manager.root.children[0].children[0].badInput = true;
		expect(manager.getFormData()).deep.eq({ foo: ['invalid'] });
	});
});
