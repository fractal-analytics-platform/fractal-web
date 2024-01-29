export default class SchemaManager {
	/**
	 * @param {import('./jschema-types').JSONSchema|undefined} schema
	 * @param {object|undefined} schemaData
	 */
	constructor(schema, schemaData) {
		this.schema = this.loadSchema(schema);
		this.data = this.loadSchemaData(schemaData);
		this.keySeparator = '###';
		this.propertiesMap = new Map();
		this.hasUnsavedChanges = false;
		/** @type {(hasChanges: boolean) => void} */
		this.onPropertyChanges = () => {};
	}

	/**
	 * @param {import('./jschema-types').JSONSchema|string|undefined} schema
	 * @returns {import('./jschema-types').JSONSchemaObjectProperty}
	 */
	loadSchema(schema) {
		if (schema === undefined) {
			throw new Error('Schema is undefined');
		}
		if (typeof schema === 'string') {
			/** @type {import('./jschema-types').JSONSchema} */
			return JSON.parse(schema);
		} else if (typeof schema === 'object') {
			/** @type {import('./jschema-types').JSONSchema} */
			return schema;
		}
		throw new Error(`Schema object has an unexpected type: ${typeof schema}`);
	}

	/**
	 * @param {object|undefined} schemaData
	 * @returns {object}
	 */
	loadSchemaData(schemaData) {
		// Should check that schemaData is not undefined
		if (schemaData === undefined) {
			throw new Error('Schema data is undefined');
		}
		// Deep copy the schema data
		return JSON.parse(JSON.stringify(schemaData));
	}

	/**
	 * @param {string} key the long key
	 * @returns
	 */
	getValue(key) {
		const keys = key.split(this.keySeparator);
		let value = this.data;
		keys.forEach((k) => {
			// Unless value is undefined, set the value to value[k]
			if (value !== undefined) {
				value = value[k];
			}
		});
		return value;
	}

	/**
	 * @param {string} key
	 * @param {any} value
	 */
	updateValue(key, value) {
		// Split key into keys
		const keys = key.split(this.keySeparator);
		// Get the last key
		const lastKey = /** @type {string} */ (keys.pop());
		// Get the object at the key
		let object = this.data;
		keys.forEach((k) => {
			// Unless k is #.#, set object to object[k]
			if (k !== this.keySeparator) object = object[k];
		});
		// Set the value at the last key
		object[lastKey] = value;

		// Mark changes as unsaved
		this.changesNotSaved();
	}

	/**
	 * @param {string} key
	 * @param {any} value
	 */
	setDefaultValue(key, value) {
		// Split key into keys
		const keys = key.split(this.keySeparator);
		// Get the last key
		const lastKey = /** @type {string} */ (keys.pop());
		// Get the object at the key
		let dataProperty = this.data;
		keys.forEach((k) => {
			// Unless k is #.#, set object to object[k]
			if (k !== this.keySeparator) dataProperty = dataProperty[k];
		});
		// Set the value at the last key
		dataProperty[lastKey] = value;
	}

	/**
	 * @param {import('./jschema-types').FormProperty} formProperty
	 * @returns {SchemaProperty}
	 */
	addProperty(formProperty) {
		const schemaPropertyKey = formProperty.property.key;
		const schemaProperty = new SchemaProperty(
			formProperty.property,
			this,
			this.getValue(schemaPropertyKey)
		);
		schemaProperty.required = formProperty.required;
		this.propertiesMap.set(formProperty.property.key, schemaProperty);
		this.setDefaultValue(schemaPropertyKey, schemaProperty.value);
		return schemaProperty;
	}

	/**
	 * @param {string} propertyKey
	 * @param {string} namedKey
	 */
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
		const lastKey = /** @type {string} */ (keys.pop());
		let dataProperty = this.data;
		keys.forEach((k) => {
			if (k !== this.keySeparator) dataProperty = dataProperty[k];
		});

		if (dataProperty[lastKey] !== undefined) delete dataProperty[lastKey][namedKey];
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
	/**
	 * @param {import('./jschema-types').JSONSchemaProperty & { key: string }} propertySchema
	 * @param {SchemaManager} manager
	 * @param {any} currentValue
	 */
	constructor(propertySchema, manager, currentValue = undefined) {
		this.manager = manager;
		this.globalSchema = this.manager.schema;
		this.referenceSchema = propertySchema;
		this.keySeparator = '###';
		this.nestedProperties = [];
		this.hasCustomKeyValues = false;
		/** @type {string[]|undefined} */
		this.requiredProperties = undefined;
		this.required = false;

		// Default properties
		this.type = propertySchema.type;
		/** @type {string} */
		this.key = propertySchema.key;
		this.title = propertySchema.title;
		this.description = propertySchema.description;
		if ('properties' in propertySchema) {
			this.properties = propertySchema.properties;
		}
		if ('items' in propertySchema) {
			this.items = propertySchema.items;
		}
		this.$ref = propertySchema.$ref;
		if ('required' in propertySchema) {
			this.requiredProperties = propertySchema.required;
		}
		if ('enum' in propertySchema) {
			this.enum = propertySchema.enum;
		}

		// Resolve the schema type by reference
		if (this.type === undefined && this.$ref !== undefined) {
			const resolvedSchema = resolveSchemaReference(this.$ref, this.globalSchema);
			if (resolvedSchema !== undefined) {
				if ('required' in resolvedSchema) {
					this.requiredProperties = resolvedSchema.required;
				}
				Object.keys(resolvedSchema).forEach((schemaKey) => {
					if (this[schemaKey] === undefined) {
						this[schemaKey] = resolvedSchema[schemaKey];
					}
				});
			}
		}

		// Resolve the schema default value
		if (propertySchema.default === undefined) {
			this.defaultValue = null;
		} else {
			this.defaultValue = propertySchema.default;
		}
		if (this.defaultValue === null) {
			if (this.type === 'array') {
				this.defaultValue = [];
			}
			if (this.type === 'object') {
				this.defaultValue = {};
			}
		}

		// Resolve the schema value
		if ('value' in propertySchema && propertySchema.value !== undefined) {
			this.value = propertySchema.value;
		} else {
			this.value = this.defaultValue;
		}

		if (currentValue !== undefined) {
			this.value = currentValue;
		}

		// Check if the schema property is of type object
		if (this.type === 'object') {
			// Check if the property schema has additional properties
			if (
				/** @type {import('./jschema-types').JSONSchemaObjectProperty} */ (propertySchema)
					.additionalProperties !== undefined
			) {
				this.hasCustomKeyValues = true;
			}
		}
	}

	isRequired() {
		return this.required;
	}

	/**
	 * @param {any} value
	 * @param {number} index
	 * @returns {SchemaProperty}
	 */
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

		const items = /** @type {import('./jschema-types').JSONSchemaArrayProperty} */ (this).items;

		// Set the nested property schema key
		propertySchema.key = `${this.key}${this.keySeparator}${index}`;
		// Set the nested property schema type
		propertySchema.type = items.type;
		// Set the nested property schema title
		propertySchema.title = items.title;
		// Set the nested property schema description
		propertySchema.description = items.description;
		// Set the nested property schema properties
		if ('properties' in items) {
			propertySchema.properties = items.properties;
		}
		// Set the nested property schema items
		if ('items' in items) {
			propertySchema.items = items.items;
		}
		// Set the nested property schema $ref
		propertySchema.$ref = items.$ref;
		// Set the nested property schema default
		propertySchema.default = items.default;
		// Set the nested property schema value
		propertySchema.value = value;
		if ('required' in items) {
			propertySchema.required = items.required;
		}

		const nestedProperty = new SchemaProperty(propertySchema, this.manager);
		this.manager.setDefaultValue(nestedProperty.key, nestedProperty.value);
		this.nestedProperties.push(nestedProperty);
		return nestedProperty;
	}

	/**
	 * @param {any} value
	 * @param {number} index
	 */
	updateNestedPropertyValue(value, index) {
		const nestedProperty = this.nestedProperties[index];
		nestedProperty.value = value;
		this.nestedProperties = this.nestedProperties.filter((p, i) =>
			i === index ? nestedProperty : p
		);
		this.manager.updateValue(this.key, this.getUpdatedNestedProperties());
	}

	/**
	 * @param {number} index
	 * @returns {any[]}
	 */
	moveNestedPropertyUp(index) {
		if (index > 0) {
			let updatedArray = [];
			for (let i = 0; i < this.nestedProperties.length; i++) {
				if (i === index - 1) {
					updatedArray[i] = this.nestedProperties[i + 1];
				} else if (i === index) {
					updatedArray[i] = this.nestedProperties[i - 1];
				} else {
					updatedArray[i] = this.nestedProperties[i];
				}
				updatedArray[i].key = `${this.key}${this.keySeparator}${i}`;
			}
			this.nestedProperties = updatedArray;
			this.manager.updateValue(this.key, this.getUpdatedNestedProperties());
		}
		return this.nestedProperties;
	}

	/**
	 * @param {number} index
	 * @returns {any[]}
	 */
	moveNestedPropertyDown(index) {
		if (index < this.nestedProperties.length - 1) {
			let updatedArray = [];
			for (let i = 0; i < this.nestedProperties.length; i++) {
				if (i === index) {
					updatedArray[i] = this.nestedProperties[i + 1];
				} else if (i === index + 1) {
					updatedArray[i] = this.nestedProperties[i - 1];
				} else {
					updatedArray[i] = this.nestedProperties[i];
				}
				updatedArray[i].key = `${this.key}${this.keySeparator}${i}`;
			}
			this.nestedProperties = updatedArray;
			this.manager.updateValue(this.key, this.getUpdatedNestedProperties());
		}
		return this.nestedProperties;
	}

	/**
	 * @param {string} namedKey
	 * @param {any} propertyValue
	 */
	addProperty(namedKey, propertyValue = undefined) {
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
			if (
				'additionalProperties' in this.referenceSchema &&
				typeof this.referenceSchema.additionalProperties === 'object'
			) {
				const parsedAdditionalProperties = JSON.parse(
					JSON.stringify(this.referenceSchema.additionalProperties)
				);
				parsedAdditionalProperties.title = namedKey;
				parsedAdditionalProperties.value = propertyValue;
				this.properties[namedKey] = parsedAdditionalProperties;
			}
		}
	}

	/**
	 * @param {string} namedKey
	 */
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

	/**
	 * @param {number} index
	 */
	removeNestedSchemaProperty(index) {
		this.nestedProperties.splice(index, 1);
		// Should update the keys of nested properties and update the value of the property
		this.manager.updateValue(this.key, this.getUpdatedNestedProperties());
	}

	getUpdatedNestedProperties() {
		return this.nestedProperties.map((nestedProperty, index) => {
			nestedProperty.key = `${this.key}${this.keySeparator}${index}`;
			return nestedProperty.value;
		});
	}
}

/**
 * Resolve a reference in a schema
 * @param {string} reference - the reference to resolve
 * @param {import('./jschema-types').JSONSchemaProperty} schema - the schema to resolve the reference against
 * @returns {import('./jschema-types').JSONSchemaProperty|undefined} the resolved reference
 */
function resolveSchemaReference(reference, schema) {
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
			/** @type {import('./jschema-types').JSONSchemaProperty} */
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

/**
 * @param {{[key: string]: import('./jschema-types').JSONSchemaProperty}} properties
 * @param {string|undefined} blockKey the parent key, undefined for root object
 * @param {string[]|undefined} required list of required properties specified in parent element
 * @returns {Array<import('./jschema-types').FormProperty>}
 */
export function mapSchemaProperties(properties, blockKey, required) {
	// Make properties object into an array
	const mapProperties = Object.keys(properties).map((key) => {
		let itemKey;
		if (blockKey === undefined) {
			// If blockKey is undefined, set it to the key
			itemKey = key;
		} else {
			// If blockKey is defined, set it to the blockKey
			itemKey = blockKey + '###' + key;
		}
		const itemRequired = Array.isArray(required) ? required.includes(key) : false;
		return { property: { ...properties[key], key: itemKey }, required: itemRequired };
	});
	return mapProperties;
}

/**
 * @param {import('./jschema-types').JSONSchemaObjectProperty} schema
 */
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
 * @param {object} obj
 * @returns {*}
 */
function removeNullValuesAndEmptyStrings(obj) {
	Object.keys(obj).forEach((key) => {
		if (Array.isArray(obj[key])) {
			// If the obj[key] is an array, filter its null and empty string values
			obj[key] = obj[key].filter((value) => value !== null && value !== '');
		}

		if (obj[key] && typeof obj[key] === 'object') removeNullValuesAndEmptyStrings(obj[key]);
		else if (obj[key] === null || obj[key] === '') delete obj[key];
	});
	return obj;
}

/**
 * Remove empty objects and arrays from an object and its nested objects
 * @param {object} obj
 * @returns {*}
 */
function removeEmptyObjectsAndArrays(obj) {
	Object.keys(obj).forEach((key) => {
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
 * @param {object} data
 * @returns {*}
 */
export function stripNullAndEmptyObjectsAndArrays(data) {
	const stripData = removeNullValuesAndEmptyStrings(data);
	return removeEmptyObjectsAndArrays(stripData);
}
