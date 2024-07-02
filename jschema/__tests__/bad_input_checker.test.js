import { describe, it, expect, vi } from 'vitest';
import { FormManager } from '../src/lib/components/form_manager';
import { checkBadInputs } from '../src/lib/components/bad_input_checker';

describe('bad_input_checker', () => {
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
			vi.fn()
		);
		expect(() => checkBadInputs(manager.root)).not.toThrowError();
		manager.root.children[0].children[0].badInput = true;
		expect(() => checkBadInputs(manager.root)).toThrowError('Invalid JSON Schema data');
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
			vi.fn()
		);
		expect(() => checkBadInputs(manager.root)).not.toThrowError();
		manager.root.children[0].children[0].badInput = true;
		expect(() => checkBadInputs(manager.root)).toThrowError('Invalid JSON Schema data');
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
			vi.fn()
		);
		expect(() => checkBadInputs(manager.root)).not.toThrowError();
		manager.root.children[0].children[0].badInput = true;
		expect(() => checkBadInputs(manager.root)).toThrowError('Invalid JSON Schema data');
	});
});
