import fs from 'fs';
import { it, expect } from 'vitest';
import { SchemaValidator } from '../src/lib/common/jschema_validation.js';
import SchemaManager, { mapSchemaProperties } from '../src/lib/components/common/jschema/schema_management.js';

it('should create a new instance of the validator', () => {
	const validator = new SchemaValidator();
	expect(validator).toBeDefined();
});

it('should validate a valid schema', () => {
	// Load the json schema definition from file
	let jsonSchema = fs.readFileSync('./lib/test/ChannelJsonSchema.json', 'utf8');
	jsonSchema = JSON.parse(jsonSchema);

	const validator = new SchemaValidator();
	const result = validator.loadSchema(jsonSchema);

	expect(result).toBe(true);
});

it('should reject an invalid schema', () => {
// Load the json schema definition from file
	let jsonSchema = fs.readFileSync('./lib/test/ChannelInvalidJsonSchema.json', 'utf8');
	jsonSchema = JSON.parse(jsonSchema);

	// Remove the required property
	delete jsonSchema.required;

	const validator = new SchemaValidator();
	const result = validator.loadSchema(jsonSchema);

	expect(result).toBe(false);
});

it('should validate a data object against a valid schema', () => {
	// Load the json schema definition from file
	let jsonSchema = fs.readFileSync('./lib/test/ChannelJsonSchema.json', 'utf8');
	jsonSchema = JSON.parse(jsonSchema);

	// Load the json data from file
	let jsonData = fs.readFileSync('./lib/test/ChannelJsonData.json', 'utf8');
	jsonData = JSON.parse(jsonData);

	const validator = new SchemaValidator();
	const result = validator.loadSchema(jsonSchema);

	expect(result).toBe(true);

	const validationResult = validator.isValid(jsonData);
	expect(validationResult).toBe(true);
	expect(validator.getErrors()).toBeNull();
});

it('should reject an invalid data object against a valid schema', () => {
	// Load the json schema definition from file
	let jsonSchema = fs.readFileSync('./lib/test/ChannelJsonSchema.json', 'utf8');
	jsonSchema = JSON.parse(jsonSchema);

	// Load the json data from file
	let jsonData = fs.readFileSync('./lib/test/ChannelInvalidJsonData.json', 'utf8');
	jsonData = JSON.parse(jsonData);

	const validator = new SchemaValidator();
	const result = validator.loadSchema(jsonSchema);

	expect(result).toBe(true);

	const validationResult = validator.isValid(jsonData);
	expect(validationResult).toBe(false);
	expect(validator.getErrors()).toBeDefined();
});

it('should accept an empty data object against a valid schema without required properties', () => {
	// Load the json schema definition from file
	let jsonSchema = fs.readFileSync('./lib/test/DefaultSchema.json', 'utf8');
	jsonSchema = JSON.parse(jsonSchema);

	// Load the json data from file
	const jsonData = {};

	const validator = new SchemaValidator();
	const result = validator.loadSchema(jsonSchema);

	expect(result).toBe(true);

	const validationResult = validator.isValid(jsonData);
	expect(validationResult).toBe(true);
	expect(validator.getErrors()).toBeNull();
});

it('should reject an empty data object against a valid schema with required properties', () => {
	// Load the json schema definition from file
	let jsonSchema = fs.readFileSync('./lib/test/ChannelJsonSchema.json', 'utf8');
	jsonSchema = JSON.parse(jsonSchema);

	// Load the json data from file
	const jsonData = {};

	const validator = new SchemaValidator();
	const result = validator.loadSchema(jsonSchema);

	expect(result).toBe(true);

	const validationResult = validator.isValid(jsonData);
	expect(validationResult).toBe(false);
	expect(validator.getErrors()).toBeDefined();
});

it('should reject a null value if the schema property is a number', () => {
	// Load the json schema definition from file
	let jsonSchema = fs.readFileSync('./lib/test/NumberJsonSchema.json', 'utf8');
	jsonSchema = JSON.parse(jsonSchema);

	// Assume that, at first the jsonData is an empty object
	let jsonData = {};

	// Initialize the validator
	const validator = new SchemaValidator();
	// Schema should be valid
	const result = validator.loadSchema(jsonSchema);
	expect(result).toBe(true);

	// Validate the empty jsonData
	const validationResult = validator.isValid(jsonData);
	// Expect validation to be true
	expect(validationResult).toBe(true);
	expect(validator.getErrors()).toBeNull();
	console.log('Errors:', validator.getErrors());

	// Now assume the jsonData has a property with a null value
	jsonData = {
		'sleep_time': null
	};
	// This situation could happen if the user does not set any value for the sleep_time
	// By default the sleep_time will be set to null because there is no default value in the schema
	// Validate the jsonData
	const validationResult2 = validator.isValid(jsonData);
	// Expect validation to be false
	expect(validationResult2).toBe(false);
	expect(validator.getErrors()).toBeDefined();
	console.log('Errors:', validator.getErrors());

	// If we use the schema manager
	// The schema manager will set the default values for the properties that are not set
	// Assuming that from the server jsonData is an empty object
	jsonData = {};
	// So the sleep_time will be set to null because the schema has no default value
	const schemaManager = new SchemaManager(jsonSchema, jsonData);
	// Initialize schema manager properties
	const schemaProperties = mapSchemaProperties(jsonSchema.properties);
	schemaProperties.forEach(prop => {
		schemaManager.addProperty(prop);
	});
	// Expect validation to be false
	const validationResult3 = validator.isValid(schemaManager.data);
	console.log('Schema manager data:', schemaManager.data);
	expect(validationResult3).toBe(false);
	expect(validator.getErrors()).toBeDefined();
	console.log('Schema manager data validation:', validator.getErrors());

	// This means that the schema manager will not be able to save changes until the sleep_time value
	// is set to a valid value, for example 0
	schemaManager.data.sleep_time = 0;
	// Expect validation to be true
	const validationResult4 = validator.isValid(schemaManager.data);
	console.log('Schema manager data:', schemaManager.data);
	expect(validationResult4).toBe(true);
	expect(validator.getErrors()).toBeNull();

});