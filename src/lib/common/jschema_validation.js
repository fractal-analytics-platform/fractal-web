/*
 *
 */

import Ajv from 'ajv';

export class SchemaValidator {
	#validator;
	#canValidate = false;

	constructor() {
		this.ajv = new Ajv();
	}

	loadSchema(schema) {
		try {
			this.#validator = this.ajv.compile(schema);
			return this.#canValidate = true;
		} catch {
			console.error('SchemaValidator:loadSchema: error compiling schema');
			return false;
		}
	}

	isValid(data) {
		if (!this.#canValidate) return null;
		return this.#validator(data);
	}

	getErrors() {
		if (!this.#canValidate) return null;
		return this.#validator.errors;
	}

}