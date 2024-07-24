import JSchema from './components/JSchema.svelte';
import PropertyDescription from './components/properties/PropertyDescription.svelte';
import { SchemaValidator, detectSchemaVersion } from './components/jschema_validation';
import { deepCopy, getValidationErrorMessage, stripNullAndEmptyObjectsAndArrays } from './utils';
import { getPropertiesToIgnore } from './components/property_utils';
import { JsonSchemaDataError } from './components/form_manager';
import { stripIgnoredProperties } from './components/jschema_adapter';

// Exporting components for public usage
export {
	JSchema,
	SchemaValidator,
	deepCopy,
	stripNullAndEmptyObjectsAndArrays,
	stripIgnoredProperties,
	getPropertiesToIgnore,
	JsonSchemaDataError,
	getValidationErrorMessage,
	PropertyDescription,
	detectSchemaVersion
};
