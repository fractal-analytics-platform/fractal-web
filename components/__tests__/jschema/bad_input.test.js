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
		const objElement =
			/** @type {import('../../src/lib/jschema/form_element').ObjectFormElement} */ (
				manager.root.children[0]
			);
		const numElement =
			/** @type {import('../../src/lib/jschema/form_element').NumberFormElement} */ (
				objElement.children[0]
			);
		numElement.badInput = true;
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

		const objElement =
			/** @type {import('../../src/lib/jschema/form_element').ObjectFormElement} */ (
				manager.root.children[0]
			);
		const numElement =
			/** @type {import('../../src/lib/jschema/form_element').NumberFormElement} */ (
				objElement.children[0]
			);
		numElement.badInput = true;
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
		const objElement =
			/** @type {import('../../src/lib/jschema/form_element').ObjectFormElement} */ (
				manager.root.children[0]
			);
		const numElement =
			/** @type {import('../../src/lib/jschema/form_element').NumberFormElement} */ (
				objElement.children[0]
			);
		numElement.badInput = true;
		expect(manager.getFormData()).deep.eq({ foo: ['invalid'] });
	});
});
