import fs from 'fs';
import { it, expect, vi } from 'vitest';
import SchemaManager from '$lib/components/common/jschema/schema_management.js';
import { mapSchemaProperties } from '$lib/components/common/jschema/schema_management.js';
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
	const jsonSchema = fs.readFileSync('./lib/test/DefaultSchema.json', 'utf8');
	const schemaData = {};

	const schemaManager = new SchemaManager(jsonSchema, schemaData);
	expect(schemaManager).toBeDefined();
	expect(schemaManager.schema).toBeDefined();

	// Validate the schema with the validator
	const validator = new SchemaValidator();
	const result = validator.loadSchema(schemaManager.schema);

	expect(result).toBe(true);

	// An empty schema is a valid schema
	const emptySchema = {};
	const emptySchemaManager = new SchemaManager(emptySchema, schemaData);
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
	const schema = fs.readFileSync('./lib/test/DefaultSchema.json', 'utf8');
	const schemaData = { 'a': 1 };

	const schemaManager = new SchemaManager(schema, schemaData);

	const retrievedValue = schemaManager.getValue('a');
	expect(retrievedValue).toBe(1);
});

it('should initialize a schema manager with a complex schema and data', () => {
	const schema = fs.readFileSync('./lib/test/DefaultSchema.json', 'utf8');
	const schemaData = {};

	const schemaManager = new SchemaManager(schema, schemaData);

	// Instantiate the schema manager with the properties
	const properties = mapSchemaProperties(schemaManager.schema.properties);
	properties.forEach((property) => {
		schemaManager.addProperty(property);
	});

	// Number data type should be defined and set
	expect(schemaManager.data.a).toBeDefined();
	expect(schemaManager.data.a).toBe(0);
	// String data type should be defined and set
	expect(schemaManager.data.b).toBeDefined();
	expect(schemaManager.data.b).toBe('string property');
	// Boolean data type should be defined and set
	expect(schemaManager.data.c).toBeDefined();
	expect(schemaManager.data.c).toBe(true);
	// Array data type should be defined and set
	expect(schemaManager.data['d']).toBeDefined();
	expect(schemaManager.data['d']).toStrictEqual([0, 1, 2]);

	// Object data type should be defined and set
	expect(schemaManager.data['obj1']).toBeDefined();

	// Nested object data type should be defined and set
	const obj1 = schemaManager.propertiesMap.get('obj1');

	const nestedObj1Properties = mapSchemaProperties(obj1.properties, 'obj1');
	nestedObj1Properties.forEach((property) => {
		schemaManager.addProperty(property);
	});

	expect(schemaManager.data['obj1']['a']).toBeDefined();
	expect(schemaManager.data['obj1']['a']).toBe(3);

});

it('should handle a schema with nested objects within arrays', () => {
	const schema = fs.readFileSync('./lib/test/DefaultSchema.json', 'utf8');
	const schemaData = {};

	const schemaManager = new SchemaManager(schema, schemaData);

	// Instantiate the schema manager with the properties
	const properties = mapSchemaProperties(schemaManager.schema.properties);
	properties.forEach((property) => {
		schemaManager.addProperty(property);
	});

	// Array property should be defined and set
	expect(schemaManager.data['m']).toBeDefined();
	// A default value should be set, in case of arrays should be an empty array
	expect(schemaManager.data['m']).toStrictEqual([]);

	// Add a new nested property to the array
	const m = schemaManager.propertiesMap.get('m');
	m.addNestedSchemaProperty(undefined, m.nestedProperties.length);

	expect(m.nestedProperties.length).toBe(1);
	expect(m.nestedProperties[0].value).toStrictEqual([]);

	// Add a new nested property to the array
	const m0 = m.nestedProperties[0];
	m0.addNestedSchemaProperty(undefined, m0.nestedProperties.length);

	expect(m0.nestedProperties.length).toBe(1);
	expect(m0.nestedProperties[0].type).toStrictEqual('array');
	expect(m0.nestedProperties[0].value).toStrictEqual([]);
	expect(m0.nestedProperties[0].items.$ref).toStrictEqual('#/definitions/Argument');


	// Add a new nested property to the array
	const m00 = m0.nestedProperties[0];
	m00.addNestedSchemaProperty(undefined, m00.nestedProperties.length);

	expect(m00.nestedProperties.length).toBe(1);
	// Now the nested property should be an object
	expect(m00.nestedProperties[0].type).toStrictEqual('object');
	expect(m00.nestedProperties[0].value).toStrictEqual({});
	expect(m00.nestedProperties[0].properties).toBeDefined();
	expect(m00.nestedProperties[0].properties.a).toBeDefined();
	expect(m00.nestedProperties[0].properties.a.type).toStrictEqual('integer');

	// Should check that the schema manager data is updated
	expect(schemaManager.data['m'][0][0]).toBeDefined();

	// Should initialize the data within the nested object
	const nestedObjectPropertySchema = m00.nestedProperties[0]; // the nested object
	const iterableProperties = mapSchemaProperties(nestedObjectPropertySchema.properties, nestedObjectPropertySchema.key);
	iterableProperties.forEach((property) => {
		schemaManager.addProperty(property);
	});

	// The values in the data managed by the schema manager should be updated and defined
	expect(schemaManager.data['m'][0][0][0]['a']).toBeDefined();
	expect(schemaManager.data['m'][0][0][0]['a']).toBe(3);
});