import fs from 'fs';
import { it, expect } from 'vitest';
import { SchemaValidator } from '../src/lib/common/jschema_validation.js';

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