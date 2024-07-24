import Ajv from 'ajv/dist/ajv';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

export class SchemaValidator {
	/**
	 * @param {'pydantic_v1'|'pydantic_v2'} schemaVersion
	 * @param {boolean} allErrors if true, check all rules collecting all errors. Default is to return after the first error.
	 */
	constructor(schemaVersion, allErrors = false) {
		const options = { strict: true, allErrors };
		this.ajv = schemaVersion === 'pydantic_v1' ? new Ajv(options) : new Ajv2020(options);
		addFormats(this.ajv);
		this.canValidate = false;
	}

	/**
	 * @param {any} schema
	 */
	validateSchema(schema) {
		this.ajv.compile(schema);
	}

	/**
	 * @param {any} schema
	 * @returns {boolean}
	 */
	loadSchema(schema) {
		try {
			this.validator = this.ajv.compile(schema);
			return (this.canValidate = true);
		} catch (err) {
			console.error('SchemaValidator: error compiling schema', err);
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

/**
 * @param {any} schema
 * @returns {'pydantic_v1'|'pydantic_v2'}
 */
export function detectSchemaVersion(schema) {
	try {
		const schemaValidatorV2 = new SchemaValidator('pydantic_v2');
		schemaValidatorV2.validateSchema(schema);
		return 'pydantic_v2';
	} catch (_) {
		const schemaValidatorV1 = new SchemaValidator('pydantic_v1');
		schemaValidatorV1.validateSchema(schema);
		return 'pydantic_v1';
	}
}
