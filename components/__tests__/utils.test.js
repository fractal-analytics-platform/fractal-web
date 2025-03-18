import { describe, it, expect } from 'vitest';
import { stripNullAndEmptyObjectsAndArrays } from '../src/lib/common/utils';

describe('utils', () => {
	it('should strip data objects correctly', () => {
		const obj = {
			valid_bool: true,
			valid_number: 1,
			valid_string: 'test',

			empty_string: '',
			empty_list: [],
			empty_object: {},
			null_value: null,

			object_with_list: {
				list: []
			},
			object_with_object: {
				object: {}
			},
			object_with_null: {
				property: {
					null: null
				},
				null: null
			},
			object_with_empty_string: {
				list_property: ['', null, 0]
			}
		};

		expect(stripNullAndEmptyObjectsAndArrays(obj)).toStrictEqual({
			valid_bool: true,
			valid_number: 1,
			valid_string: 'test',
			object_with_empty_string: {
				list_property: [0]
			}
		});
	});
});
