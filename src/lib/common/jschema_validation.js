import Ajv from 'ajv';

export class SchemaValidator {
	#validator;
	#canValidate = false;

	/**
	 * @param {boolean} allErrors if true, check all rules collecting all errors. Default is to return after the first error.
	 */
	constructor(allErrors = false) {
		this.ajv = new Ajv({ allErrors });
	}

	loadSchema(schema) {
		try {
			this.#validator = this.ajv.compile(schema);
			return (this.#canValidate = true);
		} catch {
			console.error('SchemaValidator:loadSchema: error compiling schema');
			return false;
		}
	}

	isValid(data) {
		if (!this.#canValidate) return null;
		return this.#validator(data);
	}

	/**
	 * @returns {import('ajv').ErrorObject[] | null}
	 */
	getErrors() {
		if (!this.#canValidate) return null;
		return this.#validator.errors;
	}
}
