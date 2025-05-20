import { describe, it, expect } from 'vitest';
import { getFieldValidationError, getValidationMessagesMap } from '../src/lib/common/errors';

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

	it('get validation errors array', () => {
		const errorMap = getValidationMessagesMap(
			{
				detail: [
					{
						type: 'string_too_short',
						loc: ['body', 'viewer_paths', 1],
						msg: 'String should have at least 1 character',
						input: '',
						ctx: {
							min_length: 1
						}
					},
					{
						type: 'value_error',
						loc: ['body', 'viewer_paths', 3],
						msg: "Value error, String must be an absolute path (given 'foobar').",
						input: 'foobar',
						ctx: {
							error: {}
						}
					}
				]
			},
			422
		);

		/** @type {string[]} */
		const errors = /** @type {string[]} */ ((errorMap && errorMap['viewer_paths']) || []);

		expect(errors.length).toEqual(4);
		expect(errors[0]).toBeUndefined();
		expect(errors[1]).toEqual('String should have at least 1 character');
		expect(errors[2]).toBeUndefined();
		expect(errors[3]).toEqual("Value error, String must be an absolute path (given 'foobar').");
	});
});
