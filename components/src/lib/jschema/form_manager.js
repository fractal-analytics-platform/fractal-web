import { deepCopy, stripNullAndEmptyObjectsAndArrays, undefinedToNull } from '../common/utils';
import {
	ArrayFormElement,
	EnumFormElement,
	NumberFormElement,
	ObjectFormElement,
	TupleFormElement,
	StringFormElement,
	ValueFormElement,
	BooleanFormElement
} from './form_element.js';
import { adaptJsonSchema } from './jschema_adapter.js';
import { getJsonSchemaData } from './jschema_initial_data.js';
import {
	getAllObjectProperties,
	getMax,
	getMin,
	isRemovableChildProperty,
	isTuple
} from './property_utils.js';
import { SchemaValidator } from './jschema_validation.js';

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
	constructor(originalJsonSchema, onchange, schemaVersion, propertiesToIgnore = [], initialValue = undefined) {
		/** @type {'pydantic_v1'|'pydantic_v2'} */
		this.schemaVersion = schemaVersion;
		this.jsonSchema = adaptJsonSchema(originalJsonSchema, propertiesToIgnore);

		this.validator = new SchemaValidator(schemaVersion);
		const isSchemaValid = this.validator.loadSchema(this.jsonSchema);
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
			property: this.jsonSchema,
			required: true,
			removable: false,
			value: data
		});
	}

	/**
	 * @param {{
	 * key: null|string,
	 * property: import("../types/jschema").JSONSchemaProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any
	 * }} params
	 */
	createFormElement(params) {
		const { property } = params;
		if ('enum' in property) {
			return this.createEnumElement(params);
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
	 * property: import("../types/jschema").JSONSchemaStringProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any
	 * }} params
	 */
	createStringElement({ key, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, property, required, removable });
		const element = new StringFormElement({
			...fields,
			value: value || null
		});
		return element;
	}

	/**
	 * @param {{
	 * key: null|string,
	 * property: import("../types/jschema").JSONSchemaBooleanProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any
	 * }} params
	 */
	createBooleanElement({ key, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, property, required, removable });
		const element = new BooleanFormElement({
			...fields,
			value: undefinedToNull(value)
		});
		return element;
	}

	/**
	 * @param {{
	 * key: null|string,
	 * property: import("../types/jschema").JSONSchemaNumberProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any
	 * }} params
	 */
	createNumberElement({ key, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, property, required, removable });
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
	 * property: import("../types/jschema").JSONSchemaNumberProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any
	 * }} params
	 */
	createEnumElement({ key, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, property, required, removable });
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
	 * property: import("../types/jschema").JSONSchemaObjectProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any
	 * }} params
	 */
	createObjectElement({ key, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, property, required, removable });
		const requiredChildren = property.required || [];
		const children = [];
		const properties = Object.entries(getAllObjectProperties(property, value));
		for (const [childKey, childProperty] of properties) {
			const childRequired = requiredChildren.includes(childKey);
			const childElement = this.createFormElement({
				key: childKey,
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
	 * property: import("../types/jschema").JSONSchemaArrayProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any[]
	 * }} params
	 */
	createArrayElement({ key, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, property, required, removable });
		const items = /** @type {import("../types/jschema").JSONSchemaProperty} */ (property.items);
		const children = value.map((v) =>
			this.createFormElement({
				key: null,
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
	 * property: import("../types/jschema").JSONSchemaArrayProperty,
	 * required: boolean,
	 * removable: boolean,
	 * value: any[]
	 * }} params
	 */
	createTupleElement({ key, property, required, removable, value }) {
		const fields = this.getBaseElementFields({ key, property, required, removable });
		const size = /** @type {number} */ (property.minItems);
		const items = this.schemaVersion === 'pydantic_v1' ? property.items : property.prefixItems;
		const element = new TupleFormElement({
			...fields,
			type: 'tuple',
			items,
			size,
			children:
				required || (Array.isArray(value) && value.length > 0)
					? this.createTupleChildren({ items, size, value })
					: []
		});
		return element;
	}

	/**
	 * @param {{
	 * items: import("../types/jschema").JSONSchemaProperty|import("../types/jschema").JSONSchemaProperty[],
	 * size: number,
	 * value: any
	 * }} params
	 */
	createTupleChildren({ items, size, value }) {
		const params = {
			key: null,
			required: false,
			removable: false
		};
		if (Array.isArray(items)) {
			return items.map((item, index) =>
				this.createFormElement({ ...params, property: item, value: value[index] })
			);
		} else {
			return Array(size).map((_, index) =>
				this.createFormElement({ ...params, property: items, value: value[index] })
			);
		}
	}

	/**
	 * Initializes the common base fields (title, description, ...) to create a new element
	 * @param {{
	 * key: null|string,
	 * property: import("../types/jschema").JSONSchemaProperty,
	 * required: boolean,
	 * removable: boolean
	 * }} params
	 * @returns {import("../types/form").BaseFormElementFields}
	 */
	getBaseElementFields({ key, property, required, removable }) {
		return {
			key,
			required,
			removable,
			manager: this,
			id: this.getUniqueId(),
			type: property.type || null,
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
	 * @param {ObjectFormElement} objectElement
	 */
	getDataFromObjectElement(objectElement) {
		const data = {};
		for (const child of objectElement.children) {
			let childData = this.getDataFromElement(child);
			data[child.key] = childData;
		}
		return data;
	}

	validate() {
		const strippedNullData = stripNullAndEmptyObjectsAndArrays(this.getFormData());
		const isDataValid = this.validator.isValid(strippedNullData);
		if (!isDataValid) {
			const errors = this.validator.getErrors();
			throw new JsonSchemaDataError(errors);
		}
	}

	/**
	 * @param {import('../types/form').FormElement} element
	 */
	getDataFromElement(element) {
		switch (element.type) {
			case 'object':
				return this.getDataFromObjectElement(/** @type {ObjectFormElement}*/ (element));
			case 'array':
			case 'tuple':
				return this.getDataFromArrayElement(
					/** @type {ArrayFormElement|TupleFormElement}*/ (element)
				);
			default:
				if (element instanceof ValueFormElement) {
					if (element instanceof NumberFormElement && element.badInput) {
						return 'invalid';
					}
					return element.value;
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
