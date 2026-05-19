import { SchemaValidator } from './jschema_validation';
import { _, str, not } from 'ajv/dist/compile/codegen';

/**
 * @param {import("ajv/dist/2020").Ajv2020} ajv
 * @param {import("../types/jschema").ArgsSchemaVersion} version
 */
export function addCustomExtension(ajv, version) {
	ajv.removeKeyword('contentMediaType');
	ajv.addKeyword({
		keyword: 'contentMediaType',
		type: 'string',
		// allowed type(s) of keyword value in the schema
		schemaType: 'string',
		// ensures that the only supported contentMediaType is "application/json"
		metaSchema: {
			type: 'string',
			const: 'application/json'
		},
		error: {
			message: 'Invalid JSON'
		},
		code: (cxt) => {
			const { gen, data } = cxt;
			const valid = gen.let('valid', true);
			gen.try(
				() => gen.code(_`JSON.parse(${data})`),
				() => gen.assign(valid, false)
			);
			cxt.pass(valid);
		}
	});

	ajv.removeKeyword('contentSchema');
	ajv.addKeyword({
		keyword: 'contentSchema',
		type: 'string',
		// allowed type(s) of keyword value in the schema
		schemaType: 'object',
		// ensures that contentSchema in an object
		metaSchema: {
			type: 'object'
		},
		dependencies: ['contentMediaType'],
		error: {
			message: ({ params: { error } }) => (error ? str`${error}` : str`Unexpected error`)
		},
		code: (cxt) => {
			const { gen, schema, parentSchema, data } = cxt;

			// Check contentMediaType
			if (parentSchema.contentMediaType !== 'application/json') {
				cxt.setParams({ error: 'Invalid contentMediaType' });
				cxt.pass(_`false`);
			}

			const valid = gen.let('valid', true);
			const parsed = gen.let('parsed', null);

			// Check valid JSON
			gen.try(
				() => {
					gen.assign(parsed, _`JSON.parse(${data})`);
				},
				() => gen.assign(valid, false)
			);

			gen.if(not(valid), () => {
				cxt.setParams({ error: 'Invalid JSON' });
			});
			cxt.pass(valid);

			/**
			 * This function returns a SchemaValidator instance from the current scope (scopeValue).
			 * It is necessary because the SchemaValidator class doesn't exist in the generated code and trying
			 * to instantiate it would produce "ReferenceError: SchemaValidator is not defined"
			 */
			function useSchemaValidator({ gen }) {
				const refValidator = new SchemaValidator(version, true);
				return gen.scopeValue('obj', {
					key: refValidator.toString(),
					ref: refValidator,
					code: _`new SchemaValidator(${version}, true)`
				});
			}

			gen.if(valid, () => {
				const validator = gen.let('validator', _`${useSchemaValidator(cxt)}`);
				const schemaValid = gen.let('schemaValid', _`${validator}.loadSchema(${schema})`);

				// Check valid JSON schema
				gen.if(not(schemaValid), () => {
					cxt.setParams({ error: 'Invalid JSON schema' });
				});
				cxt.pass(schemaValid);

				gen.if(
					schemaValid,
					() => {
						// Check valid data
						gen.assign(valid, _`${validator}.isValid(${parsed})`);
						gen.if(not(valid), () => {
							cxt.setParams({
								error: _`JSON.stringify(${validator}.getErrors())`
							});
						});
					},
					() => {
						gen.assign(valid, false);
					}
				);

				cxt.pass(valid);
			});

			gen.optimize();
		}
	});
}
