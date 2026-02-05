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
	ConditionalFormElement
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
import { get } from 'svelte/store';

/**
 * Creates the object used to draw the JSON Schema form, provides the functions to initialize new form elements,
 * validate the form and retrieve an object based on the data present in the form.
 */
export class FormManager {
	/**
	 * @param {import("../types/jschema").JSONSchema} originalJsonSchema
	 * @param {(data: any) => void} onchange
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

		const data = getJsonSchemaData(this.jsonSchema, schemaVersion, initialValue);
		this.onchange = onchange;
		this.notifyChange = () => {
			const data = this.getFormData();
			this.onchange(data);
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
			value: data
		});
	}

	/**
	 * @param {{
	 * key: null|string,
	 * path: string,
	 * property: import("../types/jschema").JSONSchemaProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any
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
				return this.createObjectElement({ ...params, property: objectProperty });
			}
			case 'array': {
				const arrayProperty = /** @type {import("../types/jschema").JSONSchemaArrayProperty} */ (
					property
				);
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
				return this.createNumberElement({ ...params, property: numberProperty });
			}
			case 'boolean': {
				const booleanProperty =
					/** @type {import("../types/jschema").JSONSchemaBooleanProperty} */ (property);
				return this.createBooleanElement({ ...params, property: booleanProperty });
			}
			default: {
				const stringProperty = /** @type {import("../types/jschema").JSONSchemaStringProperty} */ (
					property
				);
				return this.createStringElement({ ...params, property: stringProperty });
			}
		}
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
	 * value: any
	 * }} params
	 */
	createObjectElement({ key, path, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, path, property, required, removable });
		const requiredChildren = property.required || [];
		const children = [];
		const properties = Object.entries(getAllObjectProperties(property, value));
		for (const [childKey, childProperty] of properties) {
			const childRequired = requiredChildren.includes(childKey);
			const childElement = this.createFormElement({
				key: childKey,
				path: `${path}/${childKey}`,
				property: childProperty,
				required: childRequired,
				removable: isRemovableChildProperty(property, childKey),
				value: value[childKey]
			});
			children.push(childElement);
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
		const children = value.map((v, i) =>
			this.createFormElement({
				key: null,
				path: `${path}/${i}`,
				property: items,
				required: false,
				removable: true,
				value: v
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
					? this.createTupleChildren({ path, items, size, value })
					: []
		});
		return element;
	}

	/**
	 * @param {{
	 * path: string,
	 * items: import("../types/jschema").JSONSchemaProperty|import("../types/jschema").JSONSchemaProperty[],
	 * size: number,
	 * value: any
	 * }} params
	 */
	createTupleChildren({ path, items, size, value }) {
		const params = {
			required: false,
			removable: false
		};
		if (Array.isArray(items)) {
			return items.map((item, index) =>
				this.createFormElement({ ...params, key: index.toString(), path: `${path}/${index}`, property: item, value: value[index] })
			);
		} else {
			return Array(size).map((_, index) =>
				this.createFormElement({ ...params, key: index.toString(), path: `${path}/${index}`, property: items, value: value[index] })
			);
		}
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
		const selectedProperty = /** @type {import("../types/jschema").JSONSchemaProperty} */ (
			property.oneOf[selectedIndex]
		);
		return new ConditionalFormElement({
			...fields,
			type: 'conditional',
			selectedIndex: selectedIndex,
			selectedItem: this.createFormElement({
				key,
				path,
				property: selectedProperty,
				required,
				removable,
				value: selectedValue
			})
		});
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
			title: key && removable ? key : property.title || key || '',
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
		return this.getDataFromElement(selectedChild);
	}

	validate() {
		this.clearErrors(this.root);
		const strippedNullData = stripNullAndEmptyObjectsAndArrays(this.getFormData());
		const isDataValid = this.validator.isValid(strippedNullData);
		if (!isDataValid) {
			const errors = this.validator.getErrors();
			// Array containing errors that have not been set to any form element
			const unsetErrors = [];
			if (errors && Array.isArray(errors)) {
				for (const error of errors) {
					const errorIsSet = this.addErrorToForm(error, this.root);
					if (!errorIsSet) {
						unsetErrors.push(error);
					}
				}
			}
			if (unsetErrors.length > 0) {
				throw new JsonSchemaDataError(unsetErrors);
			}
		}
	}

	/**
	 * @param {import('../types/form').FormElement} parentElement 
	 */
	clearErrors(parentElement) {
		parentElement.clearErrors();
		if ('children' in parentElement) {
			for (const element of parentElement.children) {
				this.clearErrors(element);
			}
		}
	}

	/**
	 * @param {object} error
	 * @param {import('../types/form').FormElement} parentElement 
	 */
	addErrorToForm(error, parentElement) {
		if (error.instancePath.startsWith(parentElement.path)) {
			parentElement.hasErrors.set(true);
		}
		if (parentElement.path === error.instancePath) {
			this.setErrorToElement(error, parentElement);
			return true;
		} else if ('children' in parentElement) {
			for (const element of parentElement.children) {
				if (element.path === error.instancePath) {
					this.setErrorToElement(error, element);
					return true;
				}
				if ('children' in element && Array.isArray(element.children) && this.addErrorToForm(error, element)) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * @param {object} error 
	 * @param {import('../types/form').FormElement} element 
	 */
	setErrorToElement(error, element) {
		element.hasErrors.set(true);
		if ('params' in error && 'missingProperty' in error.params
			&& this.setMissingPropertyError(error.message, error.params.missingProperty, element)
		) {
			return;
		}
		element.addError(error.message);
	}

	/**
	 * @param {string} message 
	 * @param {string} missingProperty 
	 * @param {import('../types/form').FormElement} parentElement 
	 */
	setMissingPropertyError(message, missingProperty, parentElement) {
		if ('children' in parentElement) {
			for (const element of parentElement.children) {
				if (element.key === missingProperty) {
					element.addError(message);
					return true;
				}
			}
		}
		return false;
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
