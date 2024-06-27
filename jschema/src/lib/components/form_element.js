import { getPropertyData } from './jschema_initial_data';

/**
 * Base class for representing data associated with a form element.
 * Fields are populated by the manager and passed to the constructor.
 * @abstract
 */
export class BaseFormElement {
	manager;
	/**
	 * Unique identifier associated with the HTML element
	 */
	id;
	key;
	type;
	title;
	description;
	required;
	/**
	 * Tells if the property can be removed from an object: true for custom properties
	 * of schema objects having additionalProperties set to true.
	 */
	removable;
	/**
	 * The default value of the field
	 */
	default;

	/**
	 * @param {import("../types/form").BaseFormElementFields} fields
	 */
	constructor(fields) {
		this.manager = fields.manager;
		this.id = fields.id;
		this.key = fields.key;
		this.type = fields.type;
		this.title = fields.title;
		this.required = fields.required;
		this.description = fields.description;
		this.removable = fields.removable;
		this.default = fields.default;
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
	value;

	/**
	 * @param {import("../types/form").ValueFormElementFields<T>} fields
	 */
	constructor(fields) {
		super(fields);
		this.value = fields.value;
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
	options;

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
	}
}

export class ObjectFormElement extends BaseFormElement {
	children;
	/**
	 * @type {import("../types/jschema").JSONSchemaProperty | false}
	 */
	additionalProperties = false;

	/**
	 * @param {import("../types/form").ObjectFormElementFields} fields
	 */
	constructor(fields) {
		super(fields);
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
			property: this.additionalProperties,
			required: false,
			removable: true,
			value: getPropertyData(
				this.additionalProperties,
				false,
				this.additionalProperties.default,
				false
			)
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
		if (!this.additionalProperties) {
			console.warn('Attempted to call remove child on element without additional properties');
			return;
		}
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
}

export class ArrayFormElement extends BaseFormElement {
	children;
	items;
	minItems;
	maxItems;

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
			property: this.items,
			required: false,
			removable: true,
			value: getPropertyData(this.items, false, undefined, true)
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

	/**
	 * @param {number} index
	 */
	clearChild(index) {
		const child = this.children[index];
		if ('value' in child) {
			child.value = null;
			this.notifyChange();
		}
	}
}

export class TupleFormElement extends BaseFormElement {
	children;
	items;
	size;

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
				getPropertyData(p, false, Array.isArray(this.default) ? this.default[i] : undefined, false)
			);
		} else {
			const property = this.items;
			value = Array(this.size).map((i) =>
				getPropertyData(
					property,
					false,
					Array.isArray(this.default) ? this.default[i] : undefined,
					false
				)
			);
		}
		this.children = this.manager.createTupleChildren({ items: this.items, size: this.size, value });
		this.notifyChange();
	}

	removeTuple() {
		this.children = [];
		this.notifyChange();
	}

	/**
	 * @param {number} index
	 */
	clearChild(index) {
		const child = this.children[index];
		if ('value' in child) {
			child.value = null;
			this.notifyChange();
		}
	}
}
