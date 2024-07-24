import fs from 'fs';
import path from 'path';
import { it, expect } from 'vitest';
import { SchemaValidator, detectSchemaVersion } from '../src/lib/components/jschema_validation.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

it('should create a new instance of the validator', () => {
	const validator = new SchemaValidator('pydantic_v1');
	expect(validator).toBeDefined();
});

it('should validate a valid schema', () => {
	// Load the json schema definition from file
	let jsonSchema = fs.readFileSync(path.join(__dirname, './data/ChannelJsonSchema.json'), 'utf8');
	jsonSchema = JSON.parse(jsonSchema);

	const validator = new SchemaValidator('pydantic_v1');
	const result = validator.loadSchema(jsonSchema);

	expect(result).toBe(true);
});

it('should reject an invalid schema', () => {
	// Load the json schema definition from file
	let jsonSchema = fs.readFileSync(
		path.join(__dirname, './data/ChannelInvalidJsonSchema.json'),
		'utf8'
	);
	jsonSchema = JSON.parse(jsonSchema);

	// Remove the required property
	delete jsonSchema.required;

	const validator = new SchemaValidator('pydantic_v1');
	const result = validator.loadSchema(jsonSchema);

	expect(result).toBe(false);
});

it('should validate a data object against a valid schema', () => {
	// Load the json schema definition from file
	let jsonSchema = fs.readFileSync(path.join(__dirname, './data/ChannelJsonSchema.json'), 'utf8');
	jsonSchema = JSON.parse(jsonSchema);

	// Load the json data from file
	let jsonData = fs.readFileSync(path.join(__dirname, './data/ChannelJsonData.json'), 'utf8');
	jsonData = JSON.parse(jsonData);

	const validator = new SchemaValidator('pydantic_v1');
	const result = validator.loadSchema(jsonSchema);

	expect(result).toBe(true);

	const validationResult = validator.isValid(jsonData);
	expect(validationResult).toBe(true);
	expect(validator.getErrors()).toBeNull();
});

it('should reject an invalid data object against a valid schema', () => {
	// Load the json schema definition from file
	let jsonSchema = fs.readFileSync(path.join(__dirname, './data/ChannelJsonSchema.json'), 'utf8');
	jsonSchema = JSON.parse(jsonSchema);

	// Load the json data from file
	let jsonData = fs.readFileSync(
		path.join(__dirname, './data/ChannelInvalidJsonData.json'),
		'utf8'
	);
	jsonData = JSON.parse(jsonData);

	const validator = new SchemaValidator('pydantic_v1');
	const result = validator.loadSchema(jsonSchema);

	expect(result).toBe(true);

	const validationResult = validator.isValid(jsonData);
	expect(validationResult).toBe(false);
	expect(validator.getErrors()).toBeDefined();
});

it('should accept an empty data object against a valid schema without required properties', () => {
	// Load the json schema definition from file
	let jsonSchema = fs.readFileSync(path.join(__dirname, './data/DefaultSchema.json'), 'utf8');
	jsonSchema = JSON.parse(jsonSchema);

	// Load the json data from file
	const jsonData = {};

	const validator = new SchemaValidator('pydantic_v1');
	const result = validator.loadSchema(jsonSchema);

	expect(result).toBe(true);

	const validationResult = validator.isValid(jsonData);
	expect(validationResult).toBe(true);
	expect(validator.getErrors()).toBeNull();
});

it('should reject an empty data object against a valid schema with required properties', () => {
	// Load the json schema definition from file
	let jsonSchema = fs.readFileSync(path.join(__dirname, './data/ChannelJsonSchema.json'), 'utf8');
	jsonSchema = JSON.parse(jsonSchema);

	// Load the json data from file
	const jsonData = {};

	const validator = new SchemaValidator('pydantic_v1');
	const result = validator.loadSchema(jsonSchema);

	expect(result).toBe(true);

	const validationResult = validator.isValid(jsonData);
	expect(validationResult).toBe(false);
	expect(validator.getErrors()).toBeDefined();
});

it('should reject a null value if the schema property is a number', () => {
	// Load the json schema definition from file
	let jsonSchema = fs.readFileSync(path.join(__dirname, './data/NumberJsonSchema.json'), 'utf8');
	jsonSchema = JSON.parse(jsonSchema);

	// Assume that, at first the jsonData is an empty object
	let jsonData = {};

	// Initialize the validator
	const validator = new SchemaValidator('pydantic_v1');
	// Schema should be valid
	const result = validator.loadSchema(jsonSchema);
	expect(result).toBe(true);

	// Validate the empty jsonData
	const validationResult = validator.isValid(jsonData);
	// Expect validation to be true
	expect(validationResult).toBe(true);
	expect(validator.getErrors()).toBeNull();

	// Now assume the jsonData has a property with a null value
	jsonData = {
		sleep_time: null
	};
	// This situation could happen if the user does not set any value for the sleep_time
	// By default the sleep_time will be set to null because there is no default value in the schema
	// Validate the jsonData
	const validationResult2 = validator.isValid(jsonData);
	// Expect validation to be false
	expect(validationResult2).toBe(false);
	expect(validator.getErrors()).toBeDefined();
});

it('should detect valid pydantic_v2 schema', () => {
	const version = detectSchemaVersion({
		additionalProperties: false,
		properties: {
			testProp: {
				default: [1],
				maxItems: 1,
				minItems: 1,
				prefixItems: [{ type: 'integer' }],
				type: 'array'
			}
		},
		type: 'object'
	});
	expect(version).toEqual('pydantic_v2');
});

it('should detect valid pydantic_v1 schema', () => {
	const version = detectSchemaVersion({
		additionalProperties: false,
		properties: {
			testProp: {
				type: 'array',
				minItems: 1,
				maxItems: 1,
				additionalItems: false,
				items: [{ type: 'string' }]
			}
		},
		type: 'object'
	});
	expect(version).toEqual('pydantic_v1');
});

it('should detect invalid schema', () => {
	expect(() => detectSchemaVersion({ foo: 'bar' })).toThrowError(
		'strict mode: unknown keyword: "foo"'
	);
});
