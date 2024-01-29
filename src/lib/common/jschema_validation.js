import Ajv from 'ajv';

export class SchemaValidator {
	/**
	 * @param {boolean} allErrors if true, check all rules collecting all errors. Default is to return after the first error.
	 */
	constructor(allErrors = false) {
		this.ajv = new Ajv({ allErrors });
		this.canValidate = false;
	}

	/**
	 * @param {any} schema
	 * @returns {boolean}
	 */
	loadSchema(schema) {
		try {
			this.validator = this.ajv.compile(schema);
			return (this.canValidate = true);
		} catch {
			console.error('SchemaValidator:loadSchema: error compiling schema');
			return false;
		}
	}

	/**
	 * @param {any} data
	 * @returns {any}
	 */
	isValid(data) {
		if (!this.validator) {
			return;
		}
		if (!this.canValidate) return null;
		return this.validator(data);
	}

	/**
	 * @returns {import('ajv').ErrorObject[] | null}
	 */
	getErrors() {
		if (!this.validator) {
			return null;
		}
		if (!this.canValidate) return null;
		return this.validator.errors || null;
	}
}
