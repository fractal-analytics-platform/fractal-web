import { describe, it, expect } from 'vitest';
import { getFieldValidationError } from '../src/lib/common/errors';

describe('Error utility functions', () => {
	it('get field validation error without specifying loc', () => {
		const error = getFieldValidationError(
			{
				detail: [
					{
						loc: ['body', 'new_group_ids'],
						msg: 'value is not a valid list',
						type: 'type_error.list'
					}
				]
			},
			422
		);
		expect(error).eq('value is not a valid list');
	});
});
