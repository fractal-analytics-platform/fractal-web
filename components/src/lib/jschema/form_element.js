import { getPropertyData } from './jschema_initial_data';
import { writable } from 'svelte/store';

/**
 * Base class for representing data associated with a form element.
 * Fields are populated by the manager and passed to the constructor.
 * @abstract
 */
export class BaseFormElement {

	/** @type {import('svelte/store').Writable<string[]>} */
	errors;
	/** 
	 * This property is true also for parents of elements having an error
	 * @type {import('svelte/store').Writable<boolean>}
	 */
	hasErrors;

	/**
	 * @param {import("../types/form").BaseFormElementFields} fields
	 */
	constructor(fields) {
		this.manager = fields.manager;
		/**
		 * Unique identifier associated with the HTML element
		 */
		this.id = fields.id;
		this.key = fields.key;
		this.path = fields.path;
		this.type = fields.type;
		this.title = fields.title;
		this.required = fields.required;
		this.description = fields.description;
		/**
		 * Tells if the property can be removed from an object: true for custom properties
		 * of schema objects having additionalProperties set to true.
		 */
		this.removable = fields.removable;
		/**
		 * @type {import("../types/jschema").JSONSchemaProperty}
		 */
		this.property = fields.property;
		this.errors = writable([]);
		this.hasErrors = writable(false);
	}

	/**
	 * @param {string} message 
	 */
	addError(message) {
		this.hasErrors.set(true);
		this.errors.update(items => {
			// Note: some messages might appear twice (e.g. for conditional properties)
			if (!items.includes(message)) {
				items.push(message);
			}
			return items
		});
	}

	clearErrors() {
		this.errors.set([]);
		this.hasErrors.set(false);
	}

	notifyChange() {
		this.manager.notifyChange();
	}
}

/**
 * Base class for elements holding a primitive value (number, string, boolean, ...)
 * @template T
 * @abstract
 */
export class ValueFormElement extends BaseFormElement {
	/**
	 * @param {import("../types/form").ValueFormElementFields<T>} fields
	 */
	constructor(fields) {
		super(fields);
		this.value = writable(fields.value);
	}
}

export class StringFormElement extends ValueFormElement {
	/**
	 * @param {import("../types/form").StringFormElementFields} fields
	 */
	constructor(fields) {
		super(fields);
	}
}

export class BooleanFormElement extends ValueFormElement {
	/**
	 * @param {import("../types/form").BooleanFormElementFields} fields
	 */
	constructor(fields) {
		super(fields);
	}
}

export class EnumFormElement extends ValueFormElement {
	/**
	 * @param {import("../types/form").EnumFormElementFields} fields
	 */
	constructor(fields) {
		super(fields);
		this.options = fields.options;
	}
}

export class NumberFormElement extends ValueFormElement {
	/**
	 * @param {import("../types/form").NumberFormElementFields} fields
	 */
	constructor(fields) {
		super(fields);
		this.min = fields.min;
		this.max = fields.max;
		this.badInput = false;
	}
}

export class UnexpectedFormElement extends ValueFormElement {
	/**
	 * @param {import("../types/form").ValueFormElementFields<any>} fields
	 */
	constructor(fields) {
		super(fields);
		this.type = 'unexpected';
	}
}

export class InvalidFormElement extends ValueFormElement {
	/**
	 * @param {import("../types/form").ValueFormElementFields<any>} fields
	 */
	constructor(fields) {
		super(fields);
		this.originalType = fields.type;
		this.type = 'invalid';
	}
}

export class ObjectFormElement extends BaseFormElement {
	/**
	 * @param {import("../types/form").ObjectFormElementFields} fields
	 */
	constructor(fields) {
		super(fields);
		/**
		 * @type {import("../types/jschema").JSONSchemaProperty | false}
		 */
		this.additionalProperties = fields.additionalProperties;
		this.children = fields.children;
		this.collapsed = !fields.required;
	}

	/**
	 * @param {string} key
	 */
	addChild(key) {
		if (!this.additionalProperties) {
			return;
		}
		if (key === '') {
			throw new Error('Schema property has no name');
		}
		const allKeys = this.children.map((c) => c.key);
		if (allKeys.includes(key)) {
			throw new Error('Schema property already has a property with the same name');
		}
		const child = this.manager.createFormElement({
			key,
			path: `${this.path}/${key}`,
			property: this.additionalProperties,
			required: false,
			removable: true,
			value: getPropertyData(
				this.additionalProperties,
				this.manager.schemaVersion,
				false,
				this.additionalProperties.default,
				false
			),
			parentProperty: this.property
		});
		child.title = key;
		child.removable = true;
		this.children = [...this.children, child];
		this.notifyChange();
	}

	/**
	 * @param {string} key
	 */
	removeChild(key) {
		const filteredChildren = this.children.filter((c) => c.key === key);
		if (filteredChildren.length === 0) {
			console.warn('Attempted to remove not existing key %s', key);
			return;
		}
		const [child] = filteredChildren;
		if (!child.removable) {
			console.warn('Attempted to remove not removable child');
			return;
		}
		this.children = this.children.filter((c) => c.key !== key);
		this.notifyChange();
	}

	/**
	 * Reset a child to its default value (if it exists)
	 * @param {number} index
	 */
	resetChild(index) {
		const child = this.children[index];
		const defaultValue = child.property.default;
		if (defaultValue === undefined) {
			return;
		}
		const newChild = this.manager.createFormElement({
			key: child.key,
			path: `${this.path}/${child.key}`,
			property: child.property,
			required: child.required,
			removable: child.removable,
			value: defaultValue,
			parentProperty: this.property
		});
		newChild.collapsed = child.collapsed;
		this.children[index] = newChild;
		this.notifyChange();
	}

	/**
	 * @param {number} index 
	 */
	fixInvalidChild(index) {
		const child = /** @type {InvalidFormElement} */ (this.children[index]);
		const newChild = this.manager.createFormElement({
			key: child.key,
			path: `${this.path}/${child.key}`,
			property: {
				...child.property,
				type: child.originalType
			},
			required: child.required,
			removable: child.removable,
			value: getPropertyData(child.property, this.manager.schemaVersion, child.required, undefined, true),
			parentProperty: this.property
		});
		this.children[index] = newChild;
		this.notifyChange();
	}
}

export class ArrayFormElement extends BaseFormElement {
	/**
	 * @param {import("../types/form").ArrayFormElementFields} fields
	 */
	constructor(fields) {
		super(fields);
		this.children = fields.children;
		this.items = fields.items;
		this.minItems = fields.minItems;
		this.maxItems = fields.maxItems;
		this.collapsed = !fields.required;
	}

	addChild() {
		if (typeof this.maxItems === 'number' && this.children.length === this.maxItems) {
			return;
		}
		const child = this.manager.createFormElement({
			key: null,
			path: `${this.path}/${this.children.length}`,
			property: this.items,
			required: false,
			removable: true,
			value: getPropertyData(this.items, this.manager.schemaVersion, false, undefined, true),
			parentProperty: this.property
		});
		this.children = [...this.children, child];
		this.notifyChange();
	}

	/**
	 * @param {number} index
	 */
	removeChild(index) {
		this.children.splice(index, 1);
		this.notifyChange();
	}

	/**
	 * @param {number} index
	 */
	moveChildUp(index) {
		if (index > 0) {
			let updatedArray = [];
			for (let i = 0; i < this.children.length; i++) {
				if (i === index - 1) {
					updatedArray[i] = this.children[i + 1];
				} else if (i === index) {
					updatedArray[i] = this.children[i - 1];
				} else {
					updatedArray[i] = this.children[i];
				}
			}
			this.children = updatedArray;
			this.notifyChange();
		}
	}

	/**
	 * @param {number} index
	 */
	moveChildDown(index) {
		if (index < this.children.length - 1) {
			let updatedArray = [];
			for (let i = 0; i < this.children.length; i++) {
				if (i === index) {
					updatedArray[i] = this.children[i + 1];
				} else if (i === index + 1) {
					updatedArray[i] = this.children[i - 1];
				} else {
					updatedArray[i] = this.children[i];
				}
			}
			this.children = updatedArray;
			this.notifyChange();
		}
	}
}

export class TupleFormElement extends BaseFormElement {
	/**
	 * @param {import("../types/form").TupleFormElementFields} fields
	 */
	constructor(fields) {
		super(fields);
		this.children = fields.children;
		this.items = fields.items;
		this.size = fields.size;
		this.collapsed = !fields.required;
	}

	addTuple() {
		let value;
		if (Array.isArray(this.items)) {
			value = this.items.map((p, i) =>
				getPropertyData(
					p,
					this.manager.schemaVersion,
					false,
					Array.isArray(this.property.default) ? this.property.default[i] : undefined,
					false
				)
			);
		} else {
			const property = this.items;
			value = Array(this.size).map((i) =>
				getPropertyData(
					property,
					this.manager.schemaVersion,
					false,
					Array.isArray(this.property.default) ? this.property.default[i] : undefined,
					false
				)
			);
		}
		this.children = this.manager.createTupleChildren({
			path: this.path, items: this.items, size: this.size, value, parentProperty: this.property
		});
		this.notifyChange();
	}

	removeTuple() {
		this.children = [];
		this.notifyChange();
	}

	/**
	 * @param {number} index 
	 */
	removeUnexpectedChild(index) {
		this.children = this.children.filter((_, i) => i !== index);
		this.notifyChange();
	}
}

export class ConditionalFormElement extends BaseFormElement {
	/**
	 * @param {import("../types/form").ConditionalElementFields} fields
	 */
	constructor(fields) {
		super(fields);
		this.selectedItem = fields.selectedItem;
		this.selectedIndex = writable(fields.selectedIndex);
		this.discriminator = fields.discriminator;
	}

	/**
	 * @param {number} index
	 */
	selectChild(index) {
		this.selectedIndex.set(index);
		if ('oneOf' in this.property) {
			const selectedProp = /** @type {import("../types/jschema").JSONSchemaProperty} */ (
				this.property.oneOf[index]
			);
			this.selectedItem = this.manager.createFormElement({
				key: this.key,
				path: this.path,
				property: selectedProp,
				required: this.required,
				removable: this.removable,
				value: getPropertyData(selectedProp, this.manager.schemaVersion, false, undefined, true),
				parentProperty: this.property
			});
		}
		this.notifyChange();
	}
}
