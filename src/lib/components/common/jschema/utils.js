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


export class SchemaManager {
	keySeparator = '###';
	propertiesMap = new Map();

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
		this.data = schemaData;
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
		// unsavedChanges = true;
	}

	setDefaultValue(key, value) {
		console.log('setDefaultValue', key, value);
		console.log(this.data);
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
		const schemaProperty = new SchemaProperty(propertySchema, this.schema, this.getValue(schemaPropertyKey));
		this.propertiesMap.set(propertySchema.key, schemaProperty);
		schemaProperty.value = this.getValue(schemaProperty.key);
		return schemaProperty;
	}
}

class SchemaProperty {

	constructor(propertySchema, globalSchema, currentValue) {
		this.discriminatePropertyType(propertySchema, globalSchema, currentValue);
		// this.type = propertySchema.type;
		console.log('after discriminate property type', propertySchema);

		// Default properties
		this.type = propertySchema.type;
		this.key = propertySchema.key;
		this.title = propertySchema.title;
		this.description = propertySchema.description;
		this.properties = propertySchema.properties;
		this.items = propertySchema.items;
		this.$ref = propertySchema.$ref;

		console.log('default value', propertySchema.default);

		if (propertySchema.default === undefined) {
			this.defaultValue = null;
		} else {
			this.defaultValue = propertySchema.default;
		}

		if (propertySchema.value === undefined) {
			this.value = this.defaultValue;
		}
	}

	discriminatePropertyType(schema, globalSchema, currentValue) {
		// Discriminate the property if required
		if (schema && schema.type === undefined) {
			// The propertyData.type should not be undefined
			if (schema.$ref !== undefined) {
				// Resolve a value from the context
				const objectPropertiesValues = currentValue;
				const resolvedSchema = resolveSchemaReference(schema.$ref, globalSchema);
				console.log('resolvedSchema', resolvedSchema);
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