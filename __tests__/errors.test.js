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

	it('strip custom loc', () => {
		const errorMap = getValidationMessagesMap(
			{
				detail: [
					{
						type: 'string_type',
						loc: ['body', 'local', 'name'],
						msg: 'Input should be a valid string',
						input: null
					}
				]
			},
			422,
			['body', 'local']
		);

		/** @type {string} */
		const error = /** @type {string} */ (errorMap && errorMap['name']);

		expect(error).toEqual('Input should be a valid string');
	});

	it('strip function-after and remove duplicates', () => {
		const errorMap = getValidationMessagesMap(
			{
				detail: [
					{
						type: 'string_too_short',
						loc: [
							'body',
							'project_dirs',
							1,
							'function-after[val_os_path_normpath(), function-after[val_no_dotdot_in_path(), function-after[val_absolute_path(), constrained-str]]]'
						],
						msg: 'String should have at least 1 character',
						input: '',
						ctx: {
							min_length: 1
						}
					},
					{
						type: 'string_too_short',
						loc: ['body', 'project_dirs', 1, 'function-after[val_s3_url(), constrained-str]'],
						msg: 'String should have at least 1 character',
						input: '',
						ctx: {
							min_length: 1
						}
					}
				]
			},
			422
		);

		/** @type {string} */
		const error = /** @type {string} */ (errorMap && errorMap['project_dirs'][1]);

		expect(error).toEqual('String should have at least 1 character');
	});
});
