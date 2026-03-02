import { deepCopy, stripNullAndEmptyObjectsAndArrays, undefinedToNull } from '../common/utils';
import {
	ArrayFormElement,
	EnumFormElement,
	NumberFormElement,
	ObjectFormElement,
	TupleFormElement,
	StringFormElement,
	ValueFormElement,
	BooleanFormElement,
	ConditionalFormElement,
	InvalidFormElement,
	UnexpectedFormElement
} from './form_element.js';
import { adaptJsonSchema, stripDiscriminator } from './jschema_adapter.js';
import { getJsonSchemaData } from './jschema_initial_data.js';
import {
	getAllObjectProperties,
	getMax,
	getMin,
	isRemovableChildProperty,
	isTuple
} from './property_utils.js';
import { SchemaValidator } from './jschema_validation.js';
import { get, writable } from 'svelte/store';
import { processErrors } from './form_errors';

/**
 * Creates the object used to draw the JSON Schema form, provides the functions to initialize new form elements,
 * validate the form and retrieve an object based on the data present in the form.
 */
export class FormManager {
	/**
	 * @param {import("../types/jschema").JSONSchema} originalJsonSchema
	 * @param {(data: any, valid: boolean) => void} onchange
	 * @param {'pydantic_v1'|'pydantic_v2'} schemaVersion
	 * @param {string[]} propertiesToIgnore
	 * @param {any} initialValue
	 */
	constructor(
		originalJsonSchema,
		onchange,
		schemaVersion,
		propertiesToIgnore = [],
		initialValue = undefined
	) {
		/** @type {'pydantic_v1'|'pydantic_v2'} */
		this.schemaVersion = schemaVersion;
		this.jsonSchema = adaptJsonSchema(originalJsonSchema, propertiesToIgnore);

		this.validator = new SchemaValidator(schemaVersion, true);
		const isSchemaValid = this.validator.loadSchema(stripDiscriminator(this.jsonSchema));
		if (!isSchemaValid) {
			throw new Error('Invalid JSON Schema');
		}

		/**
		 * List of unique identifiers generated for elements
		 * @type {string[]}
		 */
		this.ids = [];
		/** @type {import('svelte/store').Writable<string[]>} */
		this.genericErrors = writable([]);
		this.dataValid = writable(true);

		const data = getJsonSchemaData(this.jsonSchema, schemaVersion, initialValue);
		this.onchange = onchange;
		this.notifyChange = () => {
			const data = this.getFormData();
			const valid = this.validate();
			this.onchange(data, valid);
		};

		/**
		 * The root of the object representing the form.
		 * @type {ObjectFormElement}
		 */
		this.root = this.createObjectElement({
			key: null,
			path: "",
			property: this.jsonSchema,
			required: true,
			removable: false,
			value: data,
			parentProperty: undefined
		});
		const valid = this.validate();
		this.onchange(data, valid);
	}

	/**
	 * @param {{
	 * key: null|string,
	 * path: string,
	 * property: import("../types/jschema").JSONSchemaProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any,
	 * parentProperty: import("../types/jschema").JSONSchemaProperty | undefined
	 * }} params
	 */
	createFormElement(params) {
		const { property } = params;
		if ('enum' in property) {
			return this.createEnumElement(
				/** @type {{ key: null|string, path: string, property: import("../types/jschema").JSONSchemaNumberProperty, required: boolean, removable: boolean, value: any }} */(
					params
				)
			);
		}
		if ('anyOf' in property) {
			const { anyOf } = property;
			if (Array.isArray(anyOf) && anyOf.length === 2 && anyOf[1].type === 'null') {
				const newDef = { ...deepCopy(params.property), ...deepCopy(anyOf[0]) };
				delete newDef['anyOf'];
				params.property = newDef;
				return this.createFormElement({ ...params })
			}
		}
		if ('oneOf' in property) {
			const oneOfProperty = /** @type {import("../types/jschema").JSONSchemaOneOfProperty} */ (
				property
			);
			return this.createConditionalElement({ ...params, property: oneOfProperty });
		}
		switch (property.type) {
			case 'object': {
				const objectProperty = /** @type {import("../types/jschema").JSONSchemaObjectProperty} */ (
					property
				);
				if (params.value && (typeof params.value !== 'object' || Array.isArray(params.value))) {
					return this.createInvalidElement({ ...params, property: objectProperty });
				}
				return this.createObjectElement({ ...params, property: objectProperty });
			}
			case 'array': {
				const arrayProperty = /** @type {import("../types/jschema").JSONSchemaArrayProperty} */ (
					property
				);
				if (params.value && !Array.isArray(params.value)) {
					return this.createInvalidElement({ ...params, property: arrayProperty });
				}
				if (isTuple(arrayProperty)) {
					return this.createTupleElement({ ...params, property: arrayProperty });
				} else {
					return this.createArrayElement({ ...params, property: arrayProperty });
				}
			}
			case 'number':
			case 'integer': {
				const numberProperty = /** @type {import("../types/jschema").JSONSchemaNumberProperty} */ (
					property
				);
				if (params.value && typeof params.value !== 'number') {
					return this.createInvalidElement({ ...params, property: numberProperty });
				}
				return this.createNumberElement({ ...params, property: numberProperty });
			}
			case 'boolean': {
				const booleanProperty =
					/** @type {import("../types/jschema").JSONSchemaBooleanProperty} */ (property);
				if (params.value && typeof params.value !== 'boolean') {
					return this.createInvalidElement({ ...params, property: booleanProperty });
				}
				return this.createBooleanElement({ ...params, property: booleanProperty });
			}
			default: {
				const stringProperty = /** @type {import("../types/jschema").JSONSchemaStringProperty} */ (
					property
				);
				if (params.value && typeof params.value === 'object') {
					return this.createInvalidElement({ ...params, property: stringProperty });
				} else if (params.value && typeof params.value !== 'string') {
					params.value = params.value.toString();
				}
				return this.createStringElement({ ...params, property: stringProperty });
			}
		}
	}

	/**
	 * Extra property that should not be present (additionalProperties: false)
	 */
	createUnexpectedElement({ key, path, value }) {
		const fields = this.getBaseElementFields({ key, path, property: { type: 'unexpected' }, required: false, removable: true });
		const element = new UnexpectedFormElement({
			...fields,
			value: value
		});
		return element;
	}

	/**
	 * Property with invalid type (e.g. array instead of boolean)
	 */
	createInvalidElement({ key, path, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, path, property, required, removable });
		const element = new InvalidFormElement({
			...fields,
			value
		});
		return element;
	}

	/**
	 * @param {{
	 * key: null|string,
	 * path: string,
	 * property: import("../types/jschema").JSONSchemaStringProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any
	 * }} params
	 */
	createStringElement({ key, path, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, path, property, required, removable });
		const element = new StringFormElement({
			...fields,
			value: value || null
		});
		return element;
	}

	/**
	 * @param {{
	 * key: null|string,
	 * path: string,
	 * property: import("../types/jschema").JSONSchemaBooleanProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any
	 * }} params
	 */
	createBooleanElement({ key, path, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, path, property, required, removable });
		const element = new BooleanFormElement({
			...fields,
			value: undefinedToNull(value)
		});
		return element;
	}

	/**
	 * @param {{
	 * key: null|string,
	 * path: string,
	 * property: import("../types/jschema").JSONSchemaNumberProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any
	 * }} params
	 */
	createNumberElement({ key, path, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, path, property, required, removable });
		const element = new NumberFormElement({
			...fields,
			type: 'number',
			value: undefinedToNull(value),
			min: getMin(property),
			max: getMax(property)
		});
		return element;
	}

	/**
	 * @param {{
	 * key: null|string,
	 * path: string,
	 * property: import("../types/jschema").JSONSchemaNumberProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any
	 * }} params
	 */
	createEnumElement({ key, path, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, path, property, required, removable });
		const element = new EnumFormElement({
			...fields,
			type: 'enum',
			value: value || null,
			options: /** @type {any[]} */ (property.enum)
		});
		return element;
	}

	/**
	 * @param {{
	 * key: null|string,
	 * path: string,
	 * property: import("../types/jschema").JSONSchemaObjectProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any,
	 * parentProperty: import("../types/jschema").JSONSchemaProperty | undefined
	 * }} params
	 */
	createObjectElement({ key, path, property, required, removable, value, parentProperty }) {
		const fields = this.getBaseElementFields({ key, path, property, required, removable });
		const requiredChildren = property.required || [];
		const children = [];
		const properties = Object.entries(getAllObjectProperties(property, value));
		/** @type {string[]} */
		const validKeys = [];
		for (const [childKey, childProperty] of properties) {
			validKeys.push(childKey)
			const childRequired = requiredChildren.includes(childKey);
			const childElement = this.createFormElement({
				key: childKey,
				path: `${path}/${childKey}`,
				property: childProperty,
				required: childRequired,
				removable: isRemovableChildProperty(property, childKey),
				value: value === null ? null : value[childKey] || null,
				parentProperty: property
			});
			children.push(childElement);
		}

		const discriminatorKey = this.getDiscriminatorKey(parentProperty);
		if (discriminatorKey) {
			// Discriminator property is removed from the child and handled separatedly
			// Adding it to the valid keys to prevent the value to being treated as an unexpected element
			validKeys.push(discriminatorKey);
		}

		if (value !== null) {
			for (const [k, v] of Object.entries(value)) {
				if (!validKeys.includes(k)) {
					children.push(this.createUnexpectedElement({
						key: k,
						path: `${path}/${k}`,
						value: v
					}))
				}
			}
		}
		const element = new ObjectFormElement({
			...fields,
			children,
			additionalProperties: property.additionalProperties || false
		});
		return element;
	}

	/**
	 * @param {{
	 * key: null|string,
	 * path: string,
	 * property: import("../types/jschema").JSONSchemaArrayProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any[]
	 * }} params
	 */
	createArrayElement({ key, path, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, path, property, required, removable });
		const items = /** @type {import("../types/jschema").JSONSchemaProperty} */ (property.items);
		const children = (value || []).map((v, i) =>
			this.createFormElement({
				key: i.toString(),
				path: `${path}/${i}`,
				property: items,
				required: false,
				removable: true,
				value: v,
				parentProperty: property
			})
		);
		const element = new ArrayFormElement({
			...fields,
			children,
			items,
			minItems: property.minItems,
			maxItems: property.maxItems
		});
		return element;
	}

	/**
	 * @param {{
	 * key: null|string,
	 * path: string,
	 * property: import("../types/jschema").JSONSchemaArrayProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any[]
	 * }} params
	 */
	createTupleElement({ key, path, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, path, property, required, removable });
		const size = /** @type {number} */ (property.minItems);
		const items = this.schemaVersion === 'pydantic_v1' ? property.items : property.prefixItems;
		const element = new TupleFormElement({
			...fields,
			type: 'tuple',
			items,
			size,
			children:
				required || (Array.isArray(value) && value.length > 0)
					? this.createTupleChildren({ path, items, size, value, parentProperty: property })
					: []
		});
		return element;
	}

	/**
	 * @param {{
	 * path: string,
	 * items: import("../types/jschema").JSONSchemaProperty|import("../types/jschema").JSONSchemaProperty[],
	 * size: number,
	 * value: any,
	 * parentProperty: import("../types/jschema").JSONSchemaProperty | undefined
	 * }} params
	 */
	createTupleChildren({ path, items, size, value, parentProperty }) {
		const params = {
			required: false,
			removable: false
		};
		let children = [];
		if (Array.isArray(items)) {
			children = items.map((item, index) =>
				this.createFormElement({ ...params, key: index.toString(), path: `${path}/${index}`, property: item, value: value[index], parentProperty })
			);
		} else {
			children = Array(size).map((_, index) =>
				this.createFormElement({ ...params, key: index.toString(), path: `${path}/${index}`, property: items, value: value[index], parentProperty })
			);
		}
		if (Array.isArray(value)) {
			for (let i = items.length; i < value.length; i++) {
				children.push(this.createUnexpectedElement({ ...params, key: i.toString(), path: `${path}/${i}`, value: value[i] }));
			}
		}
		return children;
	}

	/**
	 * @param {{
	 * key: null|string,
	 * path: string,
	 * property: import("../types/jschema").JSONSchemaOneOfProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any
	 * }} params
	 */
	createConditionalElement({ key, path, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, path, property, required, removable });
		const selectedValue = value ?? {};
		const selectedIndex = this.getConditionalElementSelectedChildIndex(property, selectedValue);
		const { discriminator, oneOfProperty } = this.extractDiscriminatorProperty(property, selectedValue);
		const selectedProperty = oneOfProperty.oneOf[selectedIndex];

		const unexpectedChildren = [];
		if (selectedIndex === -1) {
			for (const [k, v] of Object.entries(value)) {
				if (k !== discriminator?.key) {
					unexpectedChildren.push(this.createUnexpectedElement({
						key: k,
						path: `${path}/${k}`,
						value: v
					}));
				}
			}
		}

		const selectedItem = selectedIndex === -1 ? null : this.createFormElement({
			key,
			path,
			property: selectedProperty,
			required,
			removable,
			value: selectedValue,
			parentProperty: property
		});

		if (selectedItem) {
			selectedItem.title = selectedProperty.title || key || '';
		}

		return new ConditionalFormElement({
			...fields,
			type: 'conditional',
			property: oneOfProperty,
			selectedIndex: selectedIndex,
			discriminator,
			selectedItem,
			unexpectedChildren
		});
	}

	/**
	 * @param {import("../types/jschema").JSONSchemaProperty | undefined} property 
	 * @returns {string|undefined}
	 */
	getDiscriminatorKey(property) {
		if (!property) {
			return undefined;
		}
		if ('oneOf' in property && 'discriminator' in property && property.discriminator) {
			/** @type {string | undefined} */
			let discriminatorKey = undefined;
			const { propertyName } = property.discriminator;
			for (const prop of property.oneOf) {
				if (prop.type === 'object' && 'properties' in prop && prop.properties[propertyName]) {
					const discrProp = prop.properties[propertyName];
					if (discrProp.type === 'string' && 'const' in discrProp) {
						if (discriminatorKey !== undefined && discriminatorKey !== propertyName) {
							// all the objects should have the same discriminator key
							return undefined;
						}
						discriminatorKey = propertyName;
					} else {
						// we support only constant strings as discriminators
						return undefined;
					}
				} else {
					// each child should have the discriminator property
					return undefined;
				}
			}
			return discriminatorKey;
		}
		return undefined;
	}

	/**
	 * Extract the discriminator values and remove the discriminator property from each oneOf child.
	 * @param {import("../types/jschema").JSONSchemaOneOfProperty} oneOfProperty 
	 * @param {any} selectedValue
	 */
	extractDiscriminatorProperty(oneOfProperty, selectedValue) {
		if ('discriminator' in oneOfProperty && oneOfProperty.discriminator) {
			const { propertyName } = oneOfProperty.discriminator;
			const discriminator = {
				key: propertyName,
				title: '',
				description: '',
				values: /** @type {string[]} */ ([]),
				value: selectedValue[propertyName],
			}
			for (const prop of oneOfProperty.oneOf) {
				if (prop.type === 'object' && 'properties' in prop && prop.properties[propertyName]) {
					const discrProp = prop.properties[propertyName];
					if (discrProp.type === 'string' && 'const' in discrProp) {
						discriminator.values.push(discrProp.const);
						if (!discriminator.title && discrProp.title) {
							discriminator.title = discrProp.title;
						}
						if (!discriminator.description && discrProp.description) {
							discriminator.description = discrProp.description;
						}
					}
				}
			}
			if (oneOfProperty.oneOf.length > 0 && oneOfProperty.oneOf.length === discriminator.values.length) {
				if (!discriminator.value) {
					discriminator.value = discriminator.values[0];
				}
				return {
					discriminator,
					oneOfProperty: {
						...oneOfProperty,
						oneOf: oneOfProperty.oneOf.map(p => {
							const properties = { ...p.properties };
							delete properties[propertyName];
							return {
								...p,
								properties
							}
						})
					}
				}
			}
		}
		return {
			discriminator: undefined,
			oneOfProperty
		}
	}

	getConditionalElementSelectedChildIndex(property, value) {
		if ('discriminator' in property) {
			const { discriminator } = property;
			if ('propertyName' in discriminator && discriminator.propertyName in value) {
				const key = value[discriminator.propertyName];
				if ('mapping' in discriminator && key in discriminator.mapping) {
					const index = discriminator.mapping[key];
					if (typeof index === 'number' && index >= 0) {
						return index;
					}
				}
			}
		}
		if (value) {
			return -1;
		}
		return 0;
	}

	/**
	 * Initializes the common base fields (title, description, ...) to create a new element
	 * @param {{
	 * key: null|string,
	 * path: string,
	 * property: import("../types/jschema").JSONSchemaProperty,
	 * required: boolean,
	 * removable: boolean
	 * }} params
	 * @returns {import("../types/form").BaseFormElementFields}
	 */
	getBaseElementFields({ key, path, property, required, removable }) {
		return {
			key,
			path,
			required,
			removable,
			manager: this,
			id: this.getUniqueId(),
			type: 'type' in property && property.type ? property.type : null,
			title: key && removable && !key.match(/^\d+$/) ? key : property.title || key || '',
			description: property.description || '',
			property: deepCopy(property),
			notifyChange: this.notifyChange
		};
	}

	/**
	 * Unique id used as identifier for HTML elements
	 * @returns {string}
	 */
	getUniqueId() {
		let id;
		do {
			id = Math.random().toString(36).substring(7);
			if (!this.ids.includes(id)) {
				this.ids.push(id);
				break;
			}
			// eslint-disable-next-line no-constant-condition
		} while (true);
		return id;
	}

	/**
	 * Returns an object based on the data present in the form
	 * @returns {object}
	 */
	getFormData() {
		return this.getDataFromObjectElement(this.root);
	}

	/**
	 * @param {ObjectFormElement} element
	 */
	getDataFromObjectElement(element) {
		const data = {};
		for (const child of element.children) {
			let childData = this.getDataFromElement(child);
			const value =
				childData == null
					? null
					: typeof childData === 'object' &&
						'subscribe' in childData &&
						typeof childData === 'function'
						? get(childData)
						: childData;
			data[child.key] = value;
		}
		return data;
	}

	/**
	 * @param {ConditionalFormElement} element
	 */
	getDataFromConditionalElement(element) {
		const selectedChild = element.selectedItem;
		if (selectedChild) {
			const data = this.getDataFromElement(selectedChild);
			if (element.discriminator) {
				const { key } = element.discriminator;
				data[key] = element.discriminator.values[get(element.selectedIndex)];
			}
			return data;
		}
		if (element.discriminator) {
			const data = {
				[element.discriminator.key]: element.discriminator.value
			};
			for (const child of element.unexpectedChildren) {
				data[child.key] = this.getDataFromElement(child);
			}
			return data;
		}
		return null;
	}

	validate() {
		this.clearErrors(this.root);
		//const strippedNullData = stripNullAndEmptyObjectsAndArrays(this.getFormData());
		const valid = this.validator.isValid(this.getFormData());
		/** 
		 * Errors that have not been set to any form element
		 * @type {string[]}
		 */
		const genericErrors = [];
		if (!valid) {
			const errors = this.validator.getErrors();
			if (errors && Array.isArray(errors)) {
				genericErrors.push(...processErrors(this.root, errors));
			}
		}
		this.genericErrors.set(genericErrors);
		this.dataValid.set(valid);
		return valid
	}

	/**
	 * @param {import('../types/form').FormElement} parentElement 
	 */
	clearErrors(parentElement) {
		parentElement.clearErrors();
		if ('selectedItem' in parentElement && parentElement.selectedItem) {
			this.clearErrors(parentElement.selectedItem);
		} else if ('children' in parentElement) {
			for (const element of parentElement.children) {
				this.clearErrors(element);
			}
		}
	}

	/**
	 * @param {import('../types/form').FormElement} element
	 */
	getDataFromElement(element) {
		switch (element.type) {
			case 'object':
				return this.getDataFromObjectElement(/** @type {ObjectFormElement}*/(element));
			case 'array':
			case 'tuple':
				return this.getDataFromArrayElement(
					/** @type {ArrayFormElement|TupleFormElement}*/(element)
				);
			case 'conditional':
				return this.getDataFromConditionalElement(/** @type {ConditionalFormElement}*/(element));
			default:
				if (element instanceof ValueFormElement) {
					if (element instanceof NumberFormElement && element.badInput) {
						return 'invalid';
					}
					return get(element.value);
				}
				throw new Error(`Unsupported type ${element.type}`);
		}
	}

	/**
	 * @param {ArrayFormElement|TupleFormElement} arrayElement
	 */
	getDataFromArrayElement(arrayElement) {
		return arrayElement.children.map((c) => this.getDataFromElement(c));
	}
}

export class JsonSchemaDataError extends Error {
	/**
	 * @param {any} errors
	 */
	constructor(errors) {
		super('Invalid JSON Schema data');
		this.errors = errors;
	}
}
