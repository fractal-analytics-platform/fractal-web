import fs from 'fs';
import { it, expect, vi } from 'vitest';
import SchemaManager, { SchemaProperty } from '$lib/components/common/jschema/schema_management.js';
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

it('should be able to handle array properties correctly', () => {
	const schema = fs.readFileSync('./lib/test/ArraySchema.json', 'utf8');
	const schemaData = {};

	const schemaManager = new SchemaManager(schema, schemaData);
	const properties = mapSchemaProperties(schemaManager.schema.properties);

	properties.forEach((property) => {
		schemaManager.addProperty(property);
	});

	// The array property should be defined
	expect(schemaManager.data['d']).toBeDefined();

	// The array property should be an array
	expect(Array.isArray(schemaManager.data['d'])).toBe(true);

	// The array property should be empty
	expect(schemaManager.data['d'].length).toBe(3);

	// The array property should have nested properties
	const d = schemaManager.propertiesMap.get('d');
	// Initialize the nested properties
	d.value.forEach((nestedValue, index) => {
		d.addNestedSchemaProperty(nestedValue, index);
	});
	expect(d.nestedProperties.length).toBe(3);

	// TO TEST: Should be able to add a new item to the array and remove it
	// Data managed by the schema manager should be updated accordingly, moreover, upon a new addition
	// of a nested property it should not throw an error

	// Should be able to add a new item to the array
	const newNestedSchemaProperty = d.addNestedSchemaProperty(undefined, d.nestedProperties.length);
	expect(d.nestedProperties.length).toBe(4);

	expect(newNestedSchemaProperty.type).toBe('integer');
	expect(newNestedSchemaProperty.value).toBeDefined();

	// Expect the schema manager data to be correctly updated
	// By default the newly added item will be null
	expect(schemaManager.data['d']).toStrictEqual([0, 1, 2, null]);

	// Should be able to remove the first item from the nested properties
	d.removeNestedSchemaProperty(0);

	expect(d.nestedProperties.length).toBe(3);
	expect(d.nestedProperties[0].value).toBe(1);

	// Expect the schema manager data to be correctly updated
	expect(schemaManager.data['d']).toStrictEqual([1, 2, null]);

	// Should be able to add a new item to the array
	const newNestedSchemaProperty2 = d.addNestedSchemaProperty(undefined, d.nestedProperties.length);
	expect(d.nestedProperties.length).toBe(4);

	// The key of the newly inserted nested property should be different from any of the other nested properties
	// This is also important to correctly update the values in the data managed by the schema manager
	expect(newNestedSchemaProperty2.key).not.to.equal(newNestedSchemaProperty.key);

	expect(schemaManager.data['d']).toStrictEqual([1, 2, null, null]);

	// Remove a nested property from inside the array
	d.removeNestedSchemaProperty(1);

	expect(d.nestedProperties.length).toBe(3);
	expect(schemaManager.data['d']).toStrictEqual([1, null, null]);
});

it('should support additionalProperties schema definition', () => {
	const schema = fs.readFileSync('./lib/test/NapariJsonSchemaExample.json', 'utf8');
	const schemaData = {};

	const schemaManager = new SchemaManager(schema, schemaData);
	const properties = mapSchemaProperties(schemaManager.schema.properties);

	properties.forEach((property) => {
		schemaManager.addProperty(property);
	});

	// Expect that property with key input_specs is defined
	const schemaProperty = schemaManager.propertiesMap.get('input_specs');
	expect(schemaProperty).toBeDefined();
	// Expect that the property input_specs value is an empty object
	expect(schemaManager.data['input_specs']).toStrictEqual({});

	// Expect that schema property allows custom key properties
	expect(schemaProperty.hasCustomKeyValues).toBe(true);

	// schemaProperty.addNestedSchemaProperty(undefined, undefined, 'test');
	schemaProperty.addProperty('testKey');
	// expect(schemaProperty.nestedProperties.length).toBe(1);
	expect(schemaProperty.properties).toBeDefined();
	expect(schemaProperty.properties['testKey']).toBeDefined();
	expect(schemaProperty.properties['testKey'].type).toBe(undefined);

	// Add another property to schemaProperty
	schemaProperty.addProperty('testKey2');
	expect(schemaProperty.properties['testKey2']).toBeDefined();
	expect(schemaProperty.properties['testKey2'].type).toBe(undefined);
});

it.fails('should not allow additionalProperties with empty key', () => {
	const schema = fs.readFileSync('./lib/test/NapariJsonSchemaExample.json', 'utf8');
	const schemaData = {};

	const schemaManager = new SchemaManager(schema, schemaData);
	const properties = mapSchemaProperties(schemaManager.schema.properties);

	properties.forEach((property) => {
		schemaManager.addProperty(property);
	});

	// Get a schema property
	const schemaProperty = schemaManager.propertiesMap.get('input_specs');
	// Add a property with empty key
	schemaProperty.addProperty('');
});

it('should enable to add and remove nested properties from objects', () => {
	const schema = fs.readFileSync('./lib/test/NapariJsonSchemaExample.json', 'utf8');
	const schemaData = {};

	const schemaManager = new SchemaManager(schema, schemaData);
	const properties = mapSchemaProperties(schemaManager.schema.properties);

	properties.forEach((property) => {
		schemaManager.addProperty(property);
	});

	// Expect that property with key input_specs is defined
	const schemaProperty = schemaManager.propertiesMap.get('input_specs');

	// Add a nested property
	schemaProperty.addProperty('testKey');

	// Expect that the nested property is defined
	expect(schemaProperty.properties['testKey']).toBeDefined();

	// Expect that the nested property is defined in the schema manager data
	let mappedProperties = mapSchemaProperties(schemaProperty.properties, schemaProperty.key);
	schemaManager.addProperty(mappedProperties[0]);
	schemaManager.updateValue('input_specs###testKey###type', 'testValue');
	expect(schemaManager.data['input_specs']['testKey']).toBeDefined();
	expect(schemaManager.propertiesMap.has('input_specs###testKey')).toBe(true);

	// Now remove the nested property
	schemaProperty.removeProperty('testKey');
	expect(schemaProperty.properties['testKey']).toBeUndefined();

	// Expect that the nested property is removed from the schema manager data
	expect(schemaManager.data['input_specs']['testKey']).toBeUndefined();
	expect(schemaManager.propertiesMap.has('input_specs###testKey')).toBe(false);


	// Should also work with nested properties of nested properties
	schemaProperty.addProperty('testKey');
	mappedProperties = mapSchemaProperties(schemaProperty.properties, schemaProperty.key);
	const napariSchemaProperty = schemaManager.addProperty(mappedProperties[0]);
	expect(schemaManager.propertiesMap.has('input_specs###testKey')).toBe(true);
	mapSchemaProperties(napariSchemaProperty.properties, napariSchemaProperty.key).forEach((property) => {
		schemaManager.addProperty(property);
	});

	const nestedSchemaProperty = schemaManager.propertiesMap.get('input_specs###testKey###nestedObject');
	expect(schemaManager.propertiesMap.has('input_specs###testKey###nestedObject')).toBe(true);

	// Add a nested property to the nested property
	nestedSchemaProperty.addProperty('testKey2', 'string value');
	// Add nested property in the schema manager
	mapSchemaProperties(nestedSchemaProperty.properties, nestedSchemaProperty.key).forEach((property) => {
		schemaManager.addProperty(property);
	});
	expect(schemaManager.propertiesMap.has('input_specs###testKey###nestedObject###testKey2')).toBe(true);
	console.log(schemaManager.propertiesMap.keys());

	nestedSchemaProperty.removeProperty('testKey2');
	expect(nestedSchemaProperty.properties['testKey2']).toBeUndefined();
	expect(schemaManager.propertiesMap.has('input_specs###testKey###nestedObject###testKey2')).toBe(false);
	expect(schemaManager.data['input_specs']['testKey']['nestedObject']['testKey2']).toBeUndefined();
});

it('should be possible to initialize a schema property with just type definition', () => {
	const schemaManager = new SchemaManager({}, {});
	let property = new SchemaProperty({ type: 'string' }, schemaManager, null);

	expect(property.type).toBe('string');
	expect(property.value).toStrictEqual(null);

	property = new SchemaProperty({ type: 'integer' }, schemaManager);
	expect(property.type).toBe('integer');
	expect(property.value).toStrictEqual(null);

	property = new SchemaProperty({ type: 'object' }, schemaManager);
	expect(property.type).toBe('object');
	expect(property.value).toStrictEqual({});
	expect(property.properties).toBe(undefined);
});