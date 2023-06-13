import { it, expect, vi } from 'vitest';
import SchemaManager from '$lib/components/common/jschema/schema_management.js';
import { SchemaValidator } from '$lib/common/jschema_validation.js';

// Helper functions

const managerInitialization = (...args) => {
	return new SchemaManager(...args);
};


// Tests definitions

it('should create a new instance of the schema manager', () => {
	const schema = {};
	const schemaData = {};

	const schemaManager = new SchemaManager(schema, schemaData);
	expect(schemaManager).toBeDefined();
	expect(schemaManager.schema).toBeDefined();
	expect(schemaManager.schema).toStrictEqual({});
	expect(schemaManager.data).toBeDefined();
});

it('should create an instance of the schema manager with a valid schema', () => {
	const schema = {
		'$schema': 'http://json-schema.org/draft-07/schema#',
		'title': 'Channel',
		'type': 'object',
		'properties': {
			'name': {
				'type': 'string',
				'description': 'The name of the channel'
			},
			'channelNumber': {
				'type': 'integer',
				'description': 'The channel number'
			},
			'logo': {
				'type': 'string',
				'description': 'The channel logo'
			},
			'isHD': {
				'type': 'boolean',
				'description': 'Is the channel HD'
			},
			'isFavourite': {
				'type': 'boolean',
				'description': 'Is the channel a favourite'
			}
		},
		'required': ['name', 'channelNumber']
	};

	const schemaManager = new SchemaManager(schema);
	expect(schemaManager).toBeDefined();
	expect(schemaManager.schema).toBeDefined();

	// Validate the schema with the validator
	const validator = new SchemaValidator();
	const result = validator.loadSchema(schemaManager.schema);

	expect(result).toBe(true);

	// An empty schema is a valid schema
	const emptySchema = {};
	const emptySchemaManager = new SchemaManager(emptySchema);
	expect(emptySchemaManager).toBeDefined();
	expect(emptySchemaManager.schema).toBeDefined();

	const emptySchemaValidator = new SchemaValidator();
	const emptySchemaResult = emptySchemaValidator.loadSchema(emptySchemaManager.schema);

	expect(emptySchemaResult).toBe(true);
});

it('should set correctly the schema data', () => {
	expect(() => managerInitialization({})).toThrowError('Schema data is undefined');
	const managerInitSpy = vi.fn(managerInitialization);
	managerInitSpy({}, {});
	expect(managerInitSpy).toHaveReturned();
});
it('a schema manager should get a value from the data', () => {
});

