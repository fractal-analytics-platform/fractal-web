import { describe, it, expect } from 'vitest';
import { stripNullAndEmptyObjectsAndArrays, _normalize } from '../src/lib/common/utils';

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

	it('should normalize a complex nested object and track paths', () => {
		const payload = {
			foo: {
				bar: [{ baz: '  Value 1\u200B ' }, { baz: '  Value 2  ' }, null, { baz: undefined }],
				qux: '  Some text\u200B '
			},
			quux: {
				corge: '  Another value  ',
				grault: [{ garply: '  Nested value  ' }, { garply: null }],
				'key_with_space ': true
			},
			'key_with_space ': true
		};

		const normalizedPaths = _normalize(payload);

		expect(payload).toEqual({
			foo: {
				bar: [{ baz: 'Value 1' }, { baz: 'Value 2' }, null, { baz: undefined }],
				qux: 'Some text'
			},
			quux: {
				corge: 'Another value',
				grault: [{ garply: 'Nested value' }, { garply: null }],
				key_with_space: true
			},
			key_with_space: true
		});

		expect(normalizedPaths).toEqual([
			'foo.bar[0].baz',
			'foo.bar[1].baz',
			'foo.qux',
			'quux.corge',
			'quux.grault[0].garply',
			'quux',
			'root'
		]);
	});
});
