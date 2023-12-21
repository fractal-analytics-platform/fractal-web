export default class SchemaManager {
	keySeparator = '###';
	propertiesMap = new Map();
	hasUnsavedChanges = false;
	/** @type {(hasChanges: boolean) => void} */
	onPropertyChanges = () => {};

	constructor(schema, schemaData) {
		this.loadSchema(schema);
		this.loadSchemaData(schemaData);
	}

	loadSchema(schema) {
		if (schema === undefined) {
			throw new Error('Schema is undefined');
		}
		if (typeof schema === 'string') {
			this.schema = JSON.parse(schema);
		} else if (typeof schema === 'object') {
			this.schema = schema;
		}
	}

	loadSchemaData(schemaData) {
		// Should check that schemaData is not undefined
		if (schemaData === undefined) {
			throw new Error('Schema data is undefined');
		}
		// Deep copy the schema data
		this.data = JSON.parse(JSON.stringify(schemaData));
	}

	getValue(key) {
		const keys = key.split(this.keySeparator);
		let value = this.data;
		keys.forEach(k => {
			// Unless value is undefined, set the value to value[k]
			if (value !== undefined) {
				value = value[k];
			}
		});
		return value;
	}

	updateValue(key, value) {
		// Split key into keys
		const keys = key.split(this.keySeparator);
		// Get the last key
		const lastKey = keys.pop();
		// Get the object at the key
		let object = this.data;
		keys.forEach(k => {
			// Unless k is #.#, set object to object[k]
			if (k !== this.keySeparator)
				object = object[k];
		});
		// Set the value at the last key
		object[lastKey] = value;

		// Mark changes as unsaved
		this.changesNotSaved();
	}

	setDefaultValue(key, value) {
		// Split key into keys
		const keys = key.split(this.keySeparator);
		// Get the last key
		const lastKey = keys.pop();
		// Get the object at the key
		let dataProperty = this.data;
		keys.forEach(k => {
			// Unless k is #.#, set object to object[k]
			if (k !== this.keySeparator)
				dataProperty = dataProperty[k];
		});
		// Set the value at the last key
		dataProperty[lastKey] = value;
	}

	addProperty(propertySchema) {
		const schemaPropertyKey = propertySchema.key;
		const schemaProperty = new SchemaProperty(propertySchema, this, this.getValue(schemaPropertyKey));
		this.propertiesMap.set(propertySchema.key, schemaProperty);
		this.setDefaultValue(schemaPropertyKey, schemaProperty.value);
		return schemaProperty;
	}

	deleteNestedPropertyData(propertyKey, namedKey) {
		// Check if the property key is defined
		if (propertyKey === undefined) {
			throw new Error('Property key is undefined');
		}
		// Check if the named key is defined
		if (namedKey === undefined) {
			throw new Error('Named key is undefined');
		}
		// Check if the property key exists
		if (!this.propertiesMap.has(propertyKey)) {
			throw new Error('Property key does not exist');
		}

		// Delete nested property from propertiesMap
		const nestedMapKey = propertyKey + this.keySeparator + namedKey;
		this.propertiesMap.delete(nestedMapKey);

		// Delete nested property from data
		// Should traverse the data object to find the property
		const keys = propertyKey.split(this.keySeparator);
		const lastKey = keys.pop();
		let dataProperty = this.data;
		keys.forEach(k => {
			if (k !== this.keySeparator)
				dataProperty = dataProperty[k];
		});

		if (dataProperty[lastKey] !== undefined)
			delete dataProperty[lastKey][namedKey];
	}

	changesSaved() {
		this.hasUnsavedChanges = false;
		this.onPropertyChanges.call(this, this.hasUnsavedChanges);
	}

	changesNotSaved() {
		this.hasUnsavedChanges = true;
		this.onPropertyChanges.call(this, this.hasUnsavedChanges);
	}

}

export class SchemaProperty {
	manager = {};
	globalSchema = {};
	keySeparator = '###';
	nestedProperties = [];
	hasCustomKeyValues = false;

	constructor(propertySchema, manager, currentValue) {
		this.manager = manager;
		this.globalSchema = this.manager.schema;
		this.referenceSchema = propertySchema;

		// Default properties
		this.type = propertySchema.type;
		this.key = propertySchema.key;
		this.title = propertySchema.title;
		this.description = propertySchema.description;
		this.properties = propertySchema.properties;
		this.items = propertySchema.items;
		this.$ref = propertySchema.$ref;

		// Resolve the schema type by reference
		if (this.type === undefined && this.$ref !== undefined) {
			const resolvedSchema = resolveSchemaReference(this.$ref, this.globalSchema);
			Object.keys(resolvedSchema).forEach(schemaKey => {
				if (this[schemaKey] === undefined)
					this[schemaKey] = resolvedSchema[schemaKey];
			});
		}

		// Resolve the schema default value
		if (propertySchema.default === undefined) {
			this.defaultValue = null;
		} else {
			this.defaultValue = propertySchema.default;
		}
		if (this.defaultValue === null) {
			if (this.type === 'array') this.defaultValue = [];
			if (this.type === 'object') this.defaultValue = {};
		}

		// Resolve the schema value
		if (propertySchema.value === undefined) {
			this.value = this.defaultValue;
		} else {
			this.value = propertySchema.value;
		}

		if (currentValue !== undefined) {
			this.value = currentValue;
		}

		// Check if the schema property is of type object
		if (this.type === 'object') {
			// Check if the property schema has additional properties
			if (propertySchema.additionalProperties !== undefined) {
				this.hasCustomKeyValues = true;
			}
		}

	}

	isRequired() {
		if (this.globalSchema.required)
			return this.globalSchema.required.includes(this.key);
		else
			return false;
	}

	addNestedSchemaProperty(value, index) {
		// Should check that this schema property is of type array and has items
		if (this.type !== 'array') {
			throw new Error('Schema property is not of type array');
		}
		if (this.items === undefined) {
			throw new Error('Schema property does not have items');
		}
		// Define the nested property schema
		const propertySchema = {};

		// Set the nested property schema key
		propertySchema.key = `${this.key}${this.keySeparator}${index}`;
		// Set the nested property schema type
		propertySchema.type = this.items.type;
		// Set the nested property schema title
		propertySchema.title = this.items.title;
		// Set the nested property schema description
		propertySchema.description = this.items.description;
		// Set the nested property schema properties
		propertySchema.properties = this.items.properties;
		// Set the nested property schema items
		propertySchema.items = this.items.items;
		// Set the nested property schema $ref
		propertySchema.$ref = this.items.$ref;
		// Set the nested property schema default
		propertySchema.default = this.items.default;
		// Set the nested property schema value
		propertySchema.value = value;


		const nestedProperty = new SchemaProperty(propertySchema, this.manager);
		this.manager.setDefaultValue(nestedProperty.key, nestedProperty.value);
		this.nestedProperties.push(nestedProperty);
		return nestedProperty;
	}

	addProperty(namedKey, propertyValue) {
		if (this.type !== 'object') {
			throw new Error('Schema property is not of type object');
		}

		if (namedKey === '' || namedKey === undefined) {
			throw new Error('Schema property has no name');
		}

		if (this.properties && Object.keys(this.properties).includes(namedKey)) {
			throw new Error('Schema property already has a property with the same name');
		}

		if (this.hasCustomKeyValues) {
			// The schema property has additional properties
			if (this.properties === undefined) {
				this.properties = {};
			}

			// This should resolve the reference to the inner schema within the global schema
			this.properties[namedKey] = JSON.parse(JSON.stringify(this.referenceSchema.additionalProperties));
			this.properties[namedKey].title = namedKey;
			this.properties[namedKey].value = propertyValue;
		}
	}

	removeProperty(namedKey) {
		if (this.type !== 'object') {
			throw new Error('Schema property is not of type object');
		}

		if (namedKey === '' || namedKey === undefined) {
			throw new Error('Schema property has no name');
		}

		if (this.properties && Object.keys(this.properties).includes(namedKey)) {
			delete this.properties[namedKey];
			this.manager.deleteNestedPropertyData(this.key, namedKey);
		} else {
			throw new Error('Schema property does not have a property with the same name');
		}
	}

	removeNestedSchemaProperty(index) {
		this.nestedProperties.splice(index, 1);
		// Should update the keys of nested properties and update the value of the property
		const updatedValues = this.nestedProperties.map((nestedProperty, index) => {
			nestedProperty.key = `${this.key}${this.keySeparator}${index}`;
			return nestedProperty.value;
		});
		this.manager.updateValue(this.key, updatedValues);
		// this.manager.updateValue(this.key, this.value)
	}

	discriminatePropertyType(schema, globalSchema, currentValue) {
		// Discriminate the property if required
		if (schema && schema.type === undefined) {
			// The propertyData.type should not be undefined
			if (schema.$ref !== undefined) {
				// Resolve a value from the context
				const objectPropertiesValues = currentValue;
				const resolvedSchema = resolveSchemaReference(schema.$ref, globalSchema);
				// Intersect the resolved schema with the propertyData
				schema = { ...schema, ...resolvedSchema };
				if (objectPropertiesValues !== undefined) {
					Object.keys(objectPropertiesValues).forEach((key) => {
						schema.properties[key].value = objectPropertiesValues[key];
					});
				}
			}
		}
	}
}

/**
 * Resolve a reference in a schema
 * @param {string} reference - the reference to resolve
 * @param {object} schema - the schema to resolve the reference against
 * @returns {object} the resolved reference
 */
export function resolveSchemaReference(reference, schema) {
	// If reference is a string, resolve it
	if (typeof reference === 'string') {
		// If reference is a local reference, resolve it
		if (reference.startsWith('#')) {
			// Remove the first character of the reference
			reference = reference.slice(1);

			// Split the reference into its parts
			const referenceParts = reference.split('/');

			// Remove the first part of the reference
			referenceParts.shift();

			// Resolve the reference against the schema
			// NOTE: We need to stringify and parse the schema to avoid mutating it
			const jschema = JSON.stringify(schema);
			let resolvedReference = JSON.parse(jschema);
			// Resolve the reference against a new schema object
			for (const referencePart of referenceParts) {
				resolvedReference = resolvedReference[referencePart];
			}

			// Return the resolved reference
			return resolvedReference;
		}
	}
}

export function mapSchemaProperties(properties, propertiesKey) {
	// Make properties object into an array
	const mapProperties = Object.keys(properties).map(key => {
		const props = { ...properties[key] };
		// If blockKey is undefined, set it to the key
		if (propertiesKey === undefined) props.key = key;
		// If blockKey is defined, set it to the blockKey
		else props.key = propertiesKey + '###' + key;
		return props;
	});
	return mapProperties;
}

export function stripSchemaProperties(schema) {
	const ignoreProperties = ['input_paths', 'output_path', 'metadata', 'component'];
	Object.keys(schema.properties).forEach((k) => {
		if (ignoreProperties.includes(k)) {
			delete schema.properties[k];
		}
	});
	if (schema.required) {
		schema.required = schema.required.filter((k) => !ignoreProperties.includes(k));
	}
}

/**
 * Remove null values and empty strings from an object and its nested objects
 * @param obj
 * @returns {*}
 */
function removeNullValuesAndEmptyStrings(obj) {
	Object.keys(obj).forEach(key => {
		if (Array.isArray(obj[key])) {
			// If the obj[key] is an array, filter its null and empty string values
			obj[key] = obj[key].filter(value => value !== null && value !== '');
		}

		if (obj[key] && typeof obj[key] === 'object') removeNullValuesAndEmptyStrings(obj[key]);
		else if (obj[key] === null || obj[key] === '') delete obj[key];
	});
	return obj;
}

/**
 * Remove empty objects and arrays from an object and its nested objects
 * @param obj
 * @returns {*}
 */
function removeEmptyObjectsAndArrays(obj) {
	Object.keys(obj).forEach(key => {
		if (obj[key] && typeof obj[key] === 'object') {
			// Next line would enable removing empty objects and arrays from nested objects
			removeEmptyObjectsAndArrays(obj[key]);
			if (Object.keys(obj[key]).length === 0) delete obj[key];
		}
	});
	return obj;
}

/**
 * Strip null and empty objects and arrays from a data object
 * @param data
 * @returns {*}
 */
export function stripNullAndEmptyObjectsAndArrays(data) {
	const stripData = removeNullValuesAndEmptyStrings(data);
	return removeEmptyObjectsAndArrays(stripData);
}