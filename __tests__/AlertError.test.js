import { describe, it, expect } from 'vitest';
import { AlertError } from '../src/lib/common/errors';

describe('AlertError class', () => {
	it('Extract string detail for generic error', () => {
		const error = new AlertError({ detail: 'error message' }, 422);
		expect(error.getSimpleValidationMessage()).eq('error message');
	});

	it('Extract array detail for generic error', () => {
		const error = new AlertError({ detail: ['error message'] }, 422);
		expect(error.getSimpleValidationMessage()).eq('error message');
	});

	it('Extract __root__ generic error', () => {
		const error = new AlertError(
			{
				detail: [
					{
						loc: ['body', '__root__'],
						msg: 'error message',
						type: 'value_error'
					}
				]
			},
			422
		);
		expect(error.getSimpleValidationMessage()).eq('error message');
	});

	it('Extract field error', () => {
		const error = new AlertError(
			{
				detail: [
					{
						loc: ['body', 'zarr_url'],
						msg: 'error message',
						type: 'value_error'
					}
				]
			},
			422
		);
		expect(error.getSimpleValidationMessage('zarr_url')).eq('error message');
	});

	it('Extract field error', () => {
		const error = new AlertError({ message: 'Payload Too Large' }, 413);
		expect(error.getSimpleValidationMessage()).eq('Payload Too Large');
	});
});
