import JSchema from './jschema/JSchema.svelte';
import PropertyDescription from './jschema/properties/PropertyDescription.svelte';
import { SchemaValidator, detectSchemaVersion } from './jschema/jschema_validation';
import {
	deepCopy,
	getValidationErrorMessage,
	stripNullAndEmptyObjectsAndArrays
} from './common/utils';
import { greatestVersionDesc, greatestVersionAsc } from './common/version';
import { getPropertiesToIgnore } from './jschema/property_utils';
import { JsonSchemaDataError } from './jschema/form_manager';
import { stripIgnoredProperties } from './jschema/jschema_adapter';
import FilteredTasksTable from './tasks/FilteredTasksTable.svelte';

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
	detectSchemaVersion,
	FilteredTasksTable,
	greatestVersionDesc,
	greatestVersionAsc
};
